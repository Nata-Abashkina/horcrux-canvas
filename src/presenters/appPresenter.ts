// src/presenters/appPresenter.ts
import type {
  IDiaryModel,
  IInputView,
  IGuardrailsService,
  IAIClientService,
  ICanvasPresenter,
} from '../types';
import type { ILangInterface } from '../config/lang.interface';
import type { RateLimiterService } from '../services/RateLimiterService';

export class AppPresenter {
  private readonly diaryModel: IDiaryModel;
  private readonly guardrailsService: IGuardrailsService;
  private readonly inputView: IInputView;
  private readonly aiClient: IAIClientService;
  private readonly rateLimiter: RateLimiterService;
  private readonly canvasPresenter: ICanvasPresenter;

  private isProcessingEvent: boolean = false;

  constructor(
    diaryModel: IDiaryModel,
    guardrailsService: IGuardrailsService,
    inputView: IInputView,
    aiClient: IAIClientService,
    rateLimiter: RateLimiterService,
    canvasPresenter: ICanvasPresenter,
  ) {
    this.diaryModel = diaryModel;
    this.guardrailsService = guardrailsService;
    this.inputView = inputView;
    this.aiClient = aiClient;
    this.rateLimiter = rateLimiter;
    this.canvasPresenter = canvasPresenter;
  }

  public bindEvents(buttonElement: HTMLButtonElement): void {
    buttonElement.setAttribute('type', 'button');
    buttonElement.addEventListener('click', (e) => {
      e.preventDefault();
      buttonElement.blur();
      this.handleLanguageToggle();
    });
  }

  public handleModelUpdate(): void {
    if (this.isProcessingEvent) return;

    if (this.diaryModel.text.trim().length > 0 && this.diaryModel.isLocked) {
      this.processInput().catch(() => {});
    }
  }

  private handleLanguageToggle(): void {
    if (this.diaryModel.isLoading) return;

    const currentConfig = this.diaryModel.config;
    const allLanguages = this.diaryModel.languages;
    const locales = Object.keys(allLanguages);
    if (locales.length <= 1) return;

    const currentIndex = locales.indexOf(currentConfig.locale);
    const nextIndex = (currentIndex + 1) % locales.length;
    const nextLocale = locales[nextIndex];
    const nextConfig = allLanguages[nextLocale];
    if (!nextConfig) return;

    this.diaryModel.config = nextConfig;
    this.aiClient.setLanguage(nextConfig);
    this.inputView.updateLangButton(nextConfig.locale.toUpperCase());
  }

  private async processInput(): Promise<void> {
    this.isProcessingEvent = true;

    try {
      const config = this.diaryModel.config;
      const recognizedText = this.diaryModel.text;

      // 1. Пасхалка — finalizeSession вызовет CanvasPresenter
      //    в handleModelUpdate, когда эффект завершится.
      const eggType = this.findEasterEgg(recognizedText, config);
      if (eggType) {
        this.diaryModel.text = '';
        this.diaryModel.pendingImage = null;
        this.diaryModel.easterEgg = eggType;
        this.diaryModel.isLoading = false;
        return;
      }

      // 2. Guardrails — ставим aiResponse, CanvasPresenter
      //    отрисует и вызовет finalizeSession в конце анимации.
      const guardrailsResult = this.guardrailsService.validate(recognizedText, config);
      if (guardrailsResult.status !== 'PASSED') {
        this.diaryModel.pendingImage = null;
        this.diaryModel.text = '';
        this.diaryModel.aiResponse = {
          text: guardrailsResult.responseText || '',
          timestamp: Date.now(),
          isVisible: true,
        };
        this.diaryModel.isLoading = false;
        return;
      }

      // 3. Лимиты — aiResponse НЕ ставится, чистим здесь
      if (!this.rateLimiter.canProceed()) {
        this.diaryModel.pendingImage = null;
        this.diaryModel.text = '';
        this.diaryModel.isLocked = false;
        this.diaryModel.isLoading = false;
        this.canvasPresenter.finalizeSession();
        return;
      }

      // 4. Картинка обязательна — aiResponse НЕ ставится, чистим здесь
      const image = this.diaryModel.pendingImage;
      if (!image) {
        this.diaryModel.text = '';
        this.diaryModel.isLocked = false;
        this.diaryModel.isLoading = false;
        this.canvasPresenter.finalizeSession();
        return;
      }
      this.diaryModel.pendingImage = null;

      // 5. ИИ
      this.rateLimiter.record();

      let finalResponse = '';
      try {
        const aiResult = await this.aiClient.sendMessage(
          guardrailsResult.cleanedText,
          image
        );
        finalResponse = typeof aiResult === 'string' ? aiResult.trim() : '';
      } catch {
        finalResponse = '';
      }

      this.diaryModel.text = '';

      // Пустой ответ — Том молчит, aiResponse НЕ ставится, чистим здесь
      if (finalResponse.length === 0) {
        this.diaryModel.isLocked = false;
        this.diaryModel.isLoading = false;
        this.canvasPresenter.finalizeSession();
        return;
      }

      // Успешный ответ — aiResponse ставится, CanvasPresenter
      // отрисует и вызовет finalizeSession в конце анимации.
      this.diaryModel.aiResponse = {
        text: finalResponse,
        timestamp: Date.now(),
        isVisible: true,
      };
      this.diaryModel.isLoading = false;
    } catch {
      this.diaryModel.isLocked = false;
      this.diaryModel.isLoading = false;
      this.canvasPresenter.finalizeSession();
    } finally {
      this.isProcessingEvent = false;
    }
  }

  private findEasterEgg(text: string, config: ILangInterface): string | null {
    if (!config || !config.easterEggs) return null;

    const compact = text.toLowerCase().replace(/\s+/g, '');
    if (compact.length === 0) return null;

    for (const [type, egg] of Object.entries(config.easterEggs)) {
      if (egg.trigger.test(compact)) return type;
    }
    return null;
  }
}