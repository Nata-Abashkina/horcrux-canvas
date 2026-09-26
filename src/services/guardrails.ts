// src/services/guardrails.ts
import type { ILangInterface } from "../config/lang.interface";
import type { IGuardrailsService, IGuardrailsResult } from "../types.ts";

export class GuardrailsService implements IGuardrailsService {

  private normalizeString(input: string): string {
    const text = input.toLowerCase();
    const cleanText = text.replace(/[.,\/\\_|\s()-[\]]/g, "");

    return cleanText;
  }

  private checkAbuse(text: string, patterns: RegExp[]): boolean {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  private checkSpamIdentical(text: string, limit: number): boolean {
    const rule = new RegExp("(.)\\1{" + limit + "}", "i");
    return rule.test(text);
  }

  private getRandomResponse(responses: string[]): string {
    const index = Math.floor(Math.random() * responses.length);
    return responses[index];
  }

  private checkSpamConsonants(text: string, limit: number, locale: string): boolean {
    const consonantsMap: Record<string, string> = {
      ru: 'бвгджзклмнпрстфхцчшщ',
      en: 'b-df-hj-np-tv-z'
    };

    const letters = consonantsMap[locale];

    if (!letters) return false;

    const rule = new RegExp("[" + letters + "]{" + (limit + 1) + "}", 'i');
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

    const cleanText = this.normalizeString(rawInput);

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