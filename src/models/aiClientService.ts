import type { ILangInterface } from "../config/lang.interface";

export interface IChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIClientService {
  private messageHistory: IChatMessage[] = [];
  private readonly historyLimit = 11;

  constructor(langConfig: ILangInterface) {
    this.messageHistory.push({
      role: 'system',
      content: langConfig.persona.systemPrompt
    });
  }

  public setLanguage(langConfig: ILangInterface): void {
    this.messageHistory.length = 0;
    this.messageHistory.push({
      role: 'system',
      content: langConfig.persona.systemPrompt
    });
  }

  private pushMessage(role: 'user' | 'assistant', content: string): void {
    if (this.messageHistory.length === this.historyLimit) {
      this.messageHistory.splice(1, 1);
    }
    this.messageHistory.push({ role, content });
  }

  async sendMessage(prompt: string, imageBase64?: string): Promise<string> {
    this.pushMessage('user', prompt);

    // TODO: подключить Cloudflare Worker → DeepSeek vision.
    // Сейчас — заглушка. imageBase64 пойдёт в payload, когда появится Worker.
    void imageBase64;

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const stubResponse = 'Hello, Harry Potter. My name is Tom.';

    this.pushMessage('assistant', stubResponse);
    return stubResponse;
  }
}