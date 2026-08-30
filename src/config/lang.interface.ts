export interface ILangInterface {
  locale: string;
  ocr: {language: string};
  guardrails: {bannedPatterns: RegExp[], consecutiveIdenticalLimit: number, consecutiveConsonantsLimit: number};
  persona: {systemPrompt: string};
  staticResponses: {onAbuse: string[], onSpam: string[]}
}