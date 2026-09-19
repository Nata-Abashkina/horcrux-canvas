export interface ILangInterface {
  locale: string;
  ocr: {language: string};
  guardrails: {bannedPatterns: RegExp[], consecutiveIdenticalLimit: number, consecutiveConsonantsLimit: number};
  persona: {systemPrompt: string};
  staticResponses: {onAbuse: string[], onSpam: string[]};
  easterEggs: Record<string, IEasterEggConfig>;
}

interface IEasterEggConfig {
  trigger: RegExp;
  response: string;
  finalize: 'default' | 'never-returns';
  persistentArtifacts: boolean;
  overlayText?: string;
}