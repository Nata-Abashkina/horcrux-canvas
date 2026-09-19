import type { IDiaryModel, IInputView, IGuardrailsService } from '../types';
import type { ILangInterface } from '../config/lang.interface';

interface IChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export class AppPresenter {
  private readonly diaryModel: IDiaryModel;
  private readonly guardrailsService: IGuardrailsService;
  private readonly inputView: IInputView;

  private readonly chatHistory: IChatMessage[] = [];
  private isProcessingEvent: boolean = false;

  constructor(
    diaryModel: IDiaryModel,
    guardrailsService: IGuardrailsService,
    inputView: IInputView
  ) {
    this.diaryModel = diaryModel;
    this.guardrailsService = guardrailsService;
    this.inputView = inputView;

    this.diaryModel.onDataChanged = () => {
      if (this.isProcessingEvent) {
        return;
      }

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

  public initPersona(config: ILangInterface): void {
    this.chatHistory.length = 0;
    this.chatHistory.push({
      role: 'system',
      content: config.persona.systemPrompt
    });
  }

  private pushToHistory(role: 'user' | 'assistant', content: string): void {
    this.chatHistory.push({ role, content });

    if (this.chatHistory.length > 11) {
      this.chatHistory.splice(1, 1);
    }
  }

  private handleLanguageToggle(): void {
    if (this.diaryModel.isLoading) {
      return;
    }

    const currentConfig = this.diaryModel.config;
    const currentLocale = currentConfig.locale;
    const allLanguages = this.diaryModel.languages;
    const locales = Object.keys(allLanguages);

    if (locales.length <= 1) {
      return;
    }

    const currentIndex = locales.indexOf(currentLocale);
    const nextIndex = (currentIndex + 1) % locales.length;
    const nextLocale = locales[nextIndex];
    const nextConfig = allLanguages[nextLocale];

    if (!nextConfig) {
      return;
    }

    this.diaryModel.config = nextConfig;
    this.initPersona(nextConfig);
    this.inputView.updateLangButton(nextConfig.locale.toUpperCase());
  }

  private async handleModelUpdate(): Promise<void> {
    this.isProcessingEvent = true;

    try {
      const config = this.diaryModel.config;
      const recognizedText = this.diaryModel.text;

      if (this.chatHistory.length === 0) {
        this.initPersona(config);
      }

      // ПРОВЕРКА ПАСХАЛОК ПЕРВОЙ
      const eggType = this.findEasterEgg(recognizedText, config);

      if (eggType) {
        this.diaryModel.text = '';
        this.diaryModel.easterEgg = eggType;
        this.diaryModel.isLoading = false;
        return;
      }

      // Затем guardrails
      let finalResponse = '';
      const guardrailsResult = this.guardrailsService.validate(recognizedText, config);

      if (guardrailsResult.status !== 'PASSED') {
        finalResponse = guardrailsResult.responseText || '';
      } else {
        this.pushToHistory('user', guardrailsResult.cleanedText);
        finalResponse = await this.fetchAIResponse();
        this.pushToHistory('assistant', finalResponse);
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
    } finally {
      this.isProcessingEvent = false;
    }
  }

  private findEasterEgg(text: string, config: ILangInterface): string | null {
    const normalized = text.toLowerCase().replace(/\s+/g, '');

    for (const [type, egg] of Object.entries(config.easterEggs)) {
      if (egg.trigger.test(normalized)) {
        return type;
      }
    }

    return null;
  }

  private async fetchAIResponse(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return 'Hello, Harry Potter. My name is Tom.';
  }
}