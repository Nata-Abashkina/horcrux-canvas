// src/services/AIClientService.ts
import type { ILangInterface } from "../config/lang.interface";
import type { IChatMessage } from "../types";
import { WORKER_URL } from "./workerUrl";

export class AIClientService {
  private messageHistory: IChatMessage[] = [];
  private readonly historyLimit = 11;

  constructor(langConfig: ILangInterface) {
    this.messageHistory.push({
      role: 'system',
      content: langConfig.persona.systemPrompt,
    });
  }

  public setLanguage(langConfig: ILangInterface): void {
    this.messageHistory.length = 0;
    this.messageHistory.push({
      role: 'system',
      content: langConfig.persona.systemPrompt,
    });
  }

  private pushPair(userText: string, assistantText: string): void {
    // Убираем старейшую пару, если переполнено.
    // historyLimit = 11 → 1 system + 5 пар. При push пары: 11 + 2 = 13, надо срезать 2.
    if (this.messageHistory.length + 2 > this.historyLimit) {
      this.messageHistory.splice(1, 2);
    }
    this.messageHistory.push({ role: 'user', content: userText });
    this.messageHistory.push({ role: 'assistant', content: assistantText });
  }

  async sendMessage(prompt: string, imageBase64?: string): Promise<string> {
    // Снимок истории ДО запроса — чтобы не рвать пары при ошибке.
    const snapshot = [...this.messageHistory];

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image: imageBase64 ?? null,
        history: snapshot,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? '';
    const reply = typeof raw === 'string' ? raw.trim() : '';

    // Пустой ответ — Том молчит. Пару не пушим, чтобы он «не насмотрелся».
    if (reply.length === 0) {
      return '';
    }

    this.pushPair(prompt, reply);
    return reply;
  }
}