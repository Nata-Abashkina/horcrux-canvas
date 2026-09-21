import type { IDiaryModel, IInputView, IGuardrailsService, IAIClientService } from '../types';
import type { ILangInterface } from '../config/lang.interface';
import { normalizeToRu, normalizeToEn } from '../config/normalize';

export class AppPresenter {
  private readonly diaryModel: IDiaryModel;
  private readonly guardrailsService: IGuardrailsService;
  private readonly inputView: IInputView;
  private readonly aiClient: IAIClientService;

  private isProcessingEvent: boolean = false;

  constructor(
    diaryModel: IDiaryModel,
    guardrailsService: IGuardrailsService,
    inputView: IInputView,
    aiClient: IAIClientService
  ) {
    this.diaryModel = diaryModel;
    this.guardrailsService = guardrailsService;
    this.inputView = inputView;
    this.aiClient = aiClient;

    this.diaryModel.onDataChanged = () => {
      if (this.isProcessingEvent) return;

      if (this.diaryModel.text.trim().length > 0 && this.diaryModel.isLocked) {
        this.handleModelUpdate().catch((error) => {
          console.error("Критический сбой текстового контура:", error);
        });
      }
    };
  }

  public bindEvents(buttonElement: HTMLButtonElement): void {
    buttonElement.setAttribute('type', 'button');
    buttonElement.addEventListener('click', (e) => {
      e.preventDefault();
      buttonElement.blur();
      this.handleLanguageToggle();
    });
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

  private async handleModelUpdate(): Promise<void> {
    this.isProcessingEvent = true;

    try {
      const config = this.diaryModel.config;
      const recognizedText = this.diaryModel.text;

      const eggType = this.findEasterEgg(recognizedText, config);
      if (eggType) {
        this.diaryModel.text = '';
        this.diaryModel.pendingImage = null;
        this.diaryModel.easterEgg = eggType;
        this.diaryModel.isLoading = false;
        return;
      }

      let finalResponse = '';
      const guardrailsResult = this.guardrailsService.validate(recognizedText, config);

      if (guardrailsResult.status !== 'PASSED') {
        finalResponse = guardrailsResult.responseText || '';
        this.diaryModel.pendingImage = null;
      } else {
        const image = this.diaryModel.pendingImage ?? undefined;
        this.diaryModel.pendingImage = null;
        finalResponse = await this.aiClient.sendMessage(
          guardrailsResult.cleanedText,
          image
        );
      }

      this.diaryModel.text = '';
      this.diaryModel.aiResponse = {
        text: finalResponse,
        timestamp: Date.now(),
        isVisible: true
      };
      this.diaryModel.isLoading = false;
    } catch (error) {
      console.error('Ошибка в handleModelUpdate:', error);
      this.diaryModel.isLocked = false;
      this.diaryModel.isLoading = false;
    } finally {
      this.isProcessingEvent = false;
    }
  }

  private findEasterEgg(text: string, config: ILangInterface): string | null {
    const compact = text.toLowerCase().replace(/\s+/g, '');
    if (compact.length === 0) return null;

    const normalized = config.locale === 'ru'
      ? normalizeToRu(compact)
      : normalizeToEn(compact);

    for (const [type, egg] of Object.entries(config.easterEggs)) {
      if (egg.trigger.test(normalized)) return type;
    }
    return null;
  }
}