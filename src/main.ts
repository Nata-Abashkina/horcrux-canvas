// src/main.ts
import { DiaryModel } from "./models/diaryModel";
import { StrokeService } from "./services/strokeService";
import { OCRService } from "./services/OCRService";
import { CanvasView } from "./view/canvasView";
import { CanvasPresenter } from "./presenters/canvasPresenter";
import { GuardrailsService } from "./services/guardrails";
import { InputView } from "./view/inputView";
import { AppPresenter } from "./presenters/appPresenter";
import { LANGUAGES_MAP } from "./config/languages";
import { AIClientService } from "./services/aiClientService";
import { RateLimiterService } from "./services/RateLimiterService";

import { registerLore } from './config/lore.hp';

const canvasElement = document.getElementById('diary-canvas') as HTMLCanvasElement;
if (!canvasElement) {
  throw new Error("Критическая ошибка: элемент #diary-canvas не найден в DOM дереве.");
}

const langButton = document.getElementById('lang-toggle-btn') as HTMLButtonElement;
if (!langButton) {
  throw new Error("Критическая ошибка: элемент #lang-toggle-btn не найден в DOM дереве.");
}

const ctx = canvasElement.getContext("2d");
if (!ctx) {
  throw new Error("Критическая ошибка: не удалось получить 2D контекст холста.");
}

const buttonLocale = langButton.dataset.lang;
const initialConfig = buttonLocale
  ? LANGUAGES_MAP[buttonLocale]
  : Object.values(LANGUAGES_MAP)[0];

if (!initialConfig) {
  throw new Error("Критическая ошибка: нет доступных языков.");
}

const diaryModel = new DiaryModel(initialConfig);
const strokeService = new StrokeService();

const ocrService = new OCRService();
const guardrailsService = new GuardrailsService();
const aiClient = new AIClientService(initialConfig);
const rateLimiter = new RateLimiterService();

const canvasView = new CanvasView(ctx);
const inputView = new InputView(canvasElement, langButton);

const appPresenter = new AppPresenter(
  diaryModel,
  guardrailsService,
  inputView,
  aiClient,
  rateLimiter
);

const canvasPresenter = new CanvasPresenter(
  canvasView,
  strokeService,
  ocrService,
  diaryModel,
  canvasElement
);

diaryModel.subscribe(() => appPresenter.handleModelUpdate());
diaryModel.subscribe(() => canvasPresenter.handleModelUpdate());

registerLore();

appPresenter.bindEvents(langButton);
canvasPresenter.init();