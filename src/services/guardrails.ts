import type { ILangInterface } from "../config/lang.interface";
import type { IGuardrailsService, IGuardrailsResult } from "../types.ts";

export class GuardrailsService implements IGuardrailsService {
  
  private normalizeString(input: string): string {
    let text = input.toLowerCase();
    let cleanText = text.replace(/[.,\/\\_|\s()-[\]]/g, "");

    return cleanText;
  }

  private checkAbuse(text: string, patterns: RegExp[]) {
    for (let pattern of patterns) {
      if (pattern.test(text)) {
        return true;
      };
    }

    return false;
  }

  private checkSpamIdentical(text: string, limit: number) {
    let rule = new RegExp("(.)\\1{" + limit + "}", "i");
    return rule.test(text);
  }

  private getRandomResponse(responses: string[]) {
    let response = Math.floor(Math.random() * responses.length);
    return responses[response];
  }

  private checkSpamConsonants(text: string, limit: number, locale: string) {
    // 1. Создаем карту-словарь согласных букв
    const consonantsMap: Record<string, string> = {
      ru: 'бвгджзклмнпрстфхцчшщ',
      en: 'b-df-hj-np-tv-z'
    };

    // 2. Достаем буквы для текущего языка
    const letters = consonantsMap[locale];

    // 3. Если языка нет в словаре (например, китайский), просто пропускаем проверку спама
    if (!letters) return false;

    // 4. Динамически собираем регулярное выражение
    let rule = new RegExp("[" + letters + "]{" + (limit + 1) + "}", 'i');
    return rule.test(text);
  }

  validate(rawInput: string, config: ILangInterface): IGuardrailsResult {
    if (rawInput.trim().length === 0) {
      return {
        status: 'SPAM',
        cleanedText: '',
        responseText: this.getRandomResponse(config.staticResponses.onSpam)
      };
    }

    let cleanText = this.normalizeString(rawInput);
    
    if (this.checkAbuse(cleanText, config.guardrails.bannedPatterns)) {
      return {
        status: 'ABUSE',
        cleanedText: cleanText,
        responseText: this.getRandomResponse(config.staticResponses.onAbuse)
      };
    }

    if (this.checkSpamIdentical(cleanText, config.guardrails.consecutiveIdenticalLimit)) {
      return {
        status: 'SPAM',
        cleanedText: '',
        responseText: this.getRandomResponse(config.staticResponses.onSpam)
      };
    }

    if (this.checkSpamConsonants(cleanText, config.guardrails.consecutiveConsonantsLimit, config.locale)) {
      return {
        status: 'SPAM',
        cleanedText: '',
        responseText: this.getRandomResponse(config.staticResponses.onSpam)
      };
    }

    return {
      status: 'PASSED',
      cleanedText: cleanText
    };
  }
}