import { DiaryModel } from "./models/diaryModel";
import { StrokeService } from "./models/strokeService";
import { OCRService } from "./services/OCRService";
import { CanvasView } from "./view/canvasView";
import { CanvasPresenter } from "./presenters/canvasPresenter";
import { GuardrailsService } from "./services/guardrails";
import { InputView } from "./view/inputView";
import { AppPresenter } from "./presenters/appPresenter";
import { langEn } from "./config/lang.en";
import { langRU } from "./config/lang.ru";
import type { ILangInterface } from "./config/lang.interface";
import { AIClientService } from "./models/aiClientService";

import { registerLore } from './config/lore.hp';

// Все доступные языки
const languagesMap: Record<string, ILangInterface> = { ru: langRU, en: langEn };

// НАХОДИМ ФИЗИЧЕСКИЕ ЭЛЕМЕНТЫ В DOM
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

// Определяем начальный язык по кнопке
const buttonLocale = langButton.dataset.lang;
const initialConfig = buttonLocale 
  ? languagesMap[buttonLocale] 
  : Object.values(languagesMap)[0];

if (!initialConfig) {
  throw new Error("Критическая ошибка: нет доступных языков.");
}

// Создаем модель с языком из кнопки
const diaryModel = new DiaryModel(initialConfig);
const strokeService = new StrokeService();

// ЗАПУСКАЕМ СЕТЕВЫЕ И СЕРВИСНЫЕ КОНТУРЫ
const ocrService = new OCRService(); 
const guardrailsService = new GuardrailsService();
const aiClient = new AIClientService(initialConfig);

// СОЗДАЕМ ТУПЫЕ ВЬЮХИ
const canvasView = new CanvasView(ctx);
const inputView = new InputView(canvasElement, langButton);

// СОБИРАЕМ ПРЕЗЕНТЕРЫ
// СНАЧАЛА AppPresenter — он установит свой onDataChanged
const appPresenter = new AppPresenter(
  diaryModel,
  guardrailsService,
  inputView,
  aiClient
);

// ПОТОМ CanvasPresenter — он обернёт обработчик AppPresenter
const canvasPresenter = new CanvasPresenter(
  canvasView,
  strokeService,
  ocrService,
  diaryModel,
  canvasElement
);

registerLore();

// ОФИЦИАЛЬНЫЙ СТАРТ СИСТЕМЫ
appPresenter.bindEvents(langButton);
canvasPresenter.init();