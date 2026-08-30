import type { ILangInterface } from "../config/lang.interface";

// Описываем формат сообщения для ИИ, чтобы всё было строго
export interface IChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIClientService {
  // Наш FIFO-буфер: массив сообщений, где мы храним контекст беседы
  private messageHistory: IChatMessage[] = [];
  
  // Лимит истории из техпаспорта (не более 10 реплик)
  private readonly historyLimit = 10;

  // Сюда мы сейчас добавим инструменты
  constructor(langConfig: ILangInterface) {
    const systemMessage: IChatMessage = {
      role: 'system',
      content: langConfig.persona.systemPrompt
    }
    this.messageHistory.push(systemMessage)
  }

  pushMessage(role: 'user' | 'assistant', content: string): void {
    if (this.messageHistory.length === this.historyLimit) {
      this.messageHistory.splice(1, 1);
    }

    const newMessage: IChatMessage = {
      role: role,
      content: content
    }

    this.messageHistory.push(newMessage)
  }

  private apiKey: string = "";

  async sendMessage(prompt: string): Promise<string> {
    // 1. Добавляем сообщение пользователя в наш FIFO-буфер
    this.pushMessage('user', prompt);

    // 2. Если ключа нет — включается «Принцип Эхо» (Автономная заглушка)
    if (!this.apiKey) {
      const echoResponse = `Том Реддл услышал: ${prompt}`; // <- вставьте сюда переменную prompt, чтобы получить эхо

      // Добавляем ответ ИИ в историю, чтобы контекст не терялся
      this.pushMessage('assistant', echoResponse);

      // Возвращаем ответ Презентеру
      return echoResponse;
    }

    // Заглушка на случай, если код пойдет дальше
    return "Сетевой режим пока не настроен";
  }
}
