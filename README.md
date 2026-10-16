# Horcrux Diary

**Движок интерактивных «магических дневников».**  
Текущий лор — вселенная Гарри Поттера (дневник Тома Реддла).

**🔗 Прод:** [https://horcrux-diary.vercel.app](https://horcrux-diary.vercel.app/)  
**📜 Лицензия:** GPL-3.0

> ⚠️ **Работает только через VPN.**

---

## 📋 Содержание

- [1. Что это](#1-что-это)
- [2. Архитектурный базис](#2-архитектурный-базис)
- [3. Слой моделей данных](#3-слой-моделей-данных)
- [4. Слой отображения](#4-слой-отображения)
- [5. Конфиги](#5-конфиги)
- [6. Жизненный цикл потока](#6-жизненный-цикл-потока)
- [7. Физика впитывания чернил](#7-физика-впитывания-чернил)
- [8. Анимация ответа](#8-анимация-ответа)
- [9. Сетевой слой](#9-сетевой-слой)
- [10. Пасхалки](#10-пасхалки)
- [11. Локализация](#11-локализация)
- [12. Credits](#12-credits)
- [13. Сборка и деплой](#13-сборка-и-деплой)
- [14. Известные проблемы](#14-известные-проблемы)
- [15. Лицензия](#15-лицензия)

---

## 1. Что это

**Horcrux Diary** — веб-движок для интерактивных «магических дневников»: пользователь пишет или рисует на холсте, чернила впитываются, а сущность с той стороны отвечает. Движок ничего не знает про конкретный лор — всё, что касается вселенной, персонажей, триггеров и пасхалок, живёт в отдельном слое.

**Текущий лор** — вселенная Гарри Поттера: дневник Тома Реддла, 9 пасхалок, промт и guardrails в характере Тома.

Вдохновлён проектом [**riddle**](https://github.com/MaximeRivest/riddle) от Maxime Rivest — дневником Тома Реддла для reMarkable Paper Pro. Оттуда взяты идея и **формула кривых Безье** для впитывания чернил и анимации письма. Всё остальное — своя реализация с нуля под веб.

| Параметр | Значение |
|---|---|
| **Стек** | Vanilla TS, Vite 8 + rolldown (oxc), `verbatimModuleSyntax: true` |
| **Паттерн** | Стерильный MVP, анемичная модель данных, двуглавый MVP |
| **Модель ИИ** | DeepSeek-V4.1-Flash (алиас `deepseek-flash`, авто-апгрейд без изменений в коде) |
| **Деплой** | Vercel (проект `horcrux-diary`, team `Agehachou`, Hobby) |
| **Лицензия** | GPL-3.0 |

---

## 2. Архитектурный базис

- **Паттерн:** стерильный MVP с анемичной моделью данных.
- **Разделение презентеров (двуглавый MVP):**
  - `AppPresenter` (текстовый) — валидация, guardrails, пасхалки, лимиты, вызов ИИ.
  - `CanvasPresenter` (графический) — геймлуп, OCR, анимации, Безье, пасхалки.
- **Связь:** Observer — `IDiaryModel.subscribe(listener)` возвращает `unsubscribe`. Подписчики — массив, а не один бокэк.
- **Лор отделён от ядра.** Ядро — чат с ИИ и холст. Лор — надстройка, меняется за 15 минут.
- **Пасхалки — изолированный слой.** `src/easterEggs/` — движок + 9 эффектов. Ядро не знает про пасхалки. Точка расширения — `ICanvasView.getContext()`.
- **Прокси с защитой.** Origin-проверка, per-IP лимит (10/мин, бан 3 часа), глобальный дневной лимит (5000 запросов). In-memory, без KV.

### Замена лора

Чтобы поставить другой лор — удалить `effects/`, `config/lore.hp.config.ts`, `config/lore.hp.ts`, `lang.*` и добавить свои. Ядро — ноль правок.

---

## 3. Слой моделей данных

### IDiaryModel

- `isLoading: boolean`
- `isLocked: boolean`
- `config: ILangInterface`
- `text: string`
- `aiResponse: IAIResponse | null`
- `easterEgg: string | null`
- `pendingImage: string | null` — base64 скриншота пользовательского ввода (canvas → dataURL). Кладётся `CanvasPresenter` после успешного OCR, читается `AppPresenter` перед вызовом ИИ, обнуляется после каждого запроса.
- `languages: Record<string, ILangInterface>`
- `subscribe(listener: () => void): () => void` — Observer. Возвращает функцию отписки.

### IChatMessage (`types.ts`)

- `role: 'system' | 'user' | 'assistant'`
- `content: string`

### IStrokeService

- `points: IStrokePoint[]`
- `addPoint(x, y, width, height, isNew)`
- `getPoints()`
- `clear()`

### IAIClientService

- `sendMessage(prompt: string, imageBase64?: string): Promise<string>`
- `setLanguage(config: ILangInterface): void`

> **Важно:** `sendMessage` принимает **и** OCR-текст (как `prompt`, идёт в историю), **и** картинку (идёт отдельным блоком в текущем запросе к DeepSeek).

### IOCRService

- `recognize(canvasElement, langCode): Promise<string>`
- `terminate(): Promise<void>`
- `preload(langCode): Promise<void>` — ленивая предзагрузка воркера + прогрев

### IGuardrailsService

- `validate(rawInput, config): IGuardrailsResult`

### RateLimiterService

- `canProceed(): boolean` — можно ли отправить запрос. Не мутирует состояние, но **может поставить бан** при превышении.
- `record(): void` — записать успешный запрос. Вызывать только после `canProceed() === true`.
- Состояние в `localStorage` под ключом `diary-rate-limiter`.

---

## 4. Слой отображения

### ICanvasView

- `setDimensions(width, height, dpr)`
- `clear(width, height)`
- `drawStroke(pixelPoints)`
- `drawTextChar(char, x, y, font)`
- `drawSnapshot(source)`
- `drawSnapshotScaled(source, width, height)`
- `setAlpha(alpha)`
- `resetFilters()`
- `drawTextLine(line, x, y, font, alpha)`
- `measureText(text, font): number`
- `getContext(): CanvasRenderingContext2D` — точка расширения для пасхалок

### IInputView

- `updateLangButton(localeName)`

---

## 5. Конфиги

### `config/core.theme.config.ts` — ЯДРО

Собран из бывших `visual.ts` + `layout.ts` + `animations.ts`. Без лора. Без шрифтов.

Экспортирует `CORE_THEME` с тремя ветками — `colors`, `layout`, `animations` — и алиасы `COLORS`, `LAYOUT`, `ANIMATIONS`.

**Текущие значения:**

- `BASE_FONT_SIZE: 80`
- `START_X: 50`
- `START_Y: 130`
- `LETTER_SPACING: 65`
- `LINE_HEIGHT_USER: 130`
- `LINE_HEIGHT_TOM: 90`
- `MIN_SCREEN: 320`
- `MAX_SCREEN: 1920`
- `SCALE_MIN: 0.5`
- `SCALE_RANGE: 0.5`
- `ABSORPTION_FRAMES: 180`
- `ABSORPTION_DEFAULT_DURATION: 3000`
- `INPUT_DEBOUNCE_MS: 1200`
- `RESPONSE_FRAMES: 300`
- `RESPONSE_PAUSE_MS: 7000`

### `config/fonts.ts` — отдельный слой

Экспортирует:

- `FONT_TOM = 'Gabriela'`
- `FONT_INPUT = 'WDXL Lubrifont TC'`
- `FONT_PARSELTONGUE = 'Theban'`
- `FONT_IMPERIO = 'Comforter'`

> У каждого проекта свои шрифты. Ядро и пасхалки импортируют отсюда.

### `config/languages.ts` — единый источник карты языков

Экспортирует `LANGUAGES_MAP: Record<string, ILangInterface>` с ключами `ru` и `en`. Импортируется и в `main.ts`, и в `DiaryModel`. Раньше карта дублировалась в двух местах — теперь один источник правды.

### `config/lang.ru.ts`, `config/lang.en.ts`

Лор (тексты, триггеры, промт, guardrails, easterEggs).

### `config/lang.interface.ts`

`ILangInterface` + `IEasterEggConfig` (экспортируется).

### `config/lore.hp.ts` — регистрация пасхалок

`main.ts` вызывает `registerLore()`. Это место, где пасхалки подключаются к реестру.

### `config/normalize.ts`

`normalizeToRu` / `normalizeToEn`. Ловит Круцио, Империо, Нагайна.

### `src/easterEggs/config/lore.hp.config.ts` — ЛОР

Цвета, пропорции, тайминги пасхалок. Ядро сюда не лазает.

---

## 6. Жизненный цикл потока

### Ввод

- Pointer Events + `setPointerCapture` + `preventDefault` + `{ passive: false }`.
- `touch-action: none` на canvas (Android + iOS).
- `pointercancel` → `handlePointerUp`.
- `e.buttons === 0` — только для `pointerType === 'mouse'`.
- **Mutex:** дебаунс 1200 мс (`INPUT_DEBOUNCE_MS`). Пока таймер идёт — второе устройство заблокировано.
- **Блокировка:** `isLocked` ставится сразу в колбэке таймера (до `executeAbsorptionLoop`), снимается только после ответа (или при пустом OCR).

### Взаимная блокировка устройств

- Начал печатать (`isTyping = true`) → мышь заблокирована.
- Начал рисовать (`isDrawing = true`) → клавиатура заблокирована.
- Пока идёт таймер → блокировка держится.
- Таймер догорел → `isLocked = true` → ввод заблокирован полностью до конца ответа.
- OCR пусто → `isLocked = false` → ввод свободен, **ответа нет**.
- Ответ исчез → `isLocked = false` → ввод свободен.

### iOS-глушилки (Safari)

- **CSS:** `user-select: none`, `-webkit-touch-callout: none`, `-webkit-tap-highlight-color: transparent` на `canvas`, `body`, `.diary-container`.
- **JS на canvas:** `contextmenu`, `selectstart`, `dragstart` → `preventDefault()`.
- `touchmove` → `preventDefault()` с `{ passive: false }`.
- `touchstart` → `preventDefault()` только при `e.touches.length > 1`.

---

## 7. Физика впитывания чернил

- **Принцип:** Безье-кривые (`quadraticCurveTo`) + прозрачность.
- **Тайминг:** `ABSORPTION_FRAMES = 180` (~3 сек).
- **Фазы:** капиллярный распад → хронологический сдвиг.
- **Кэширование:** слепок canvas до анимации (для `crucialLayer`).
- **Реализация:** `drawFadingStrokes` и `drawFadingText` в `CanvasPresenter` работают напрямую через `ctx` (из `view.getContext()`). Безье — в презентере, не во View.

---

## 8. Анимация ответа

- **Появление:** `RESPONSE_FRAMES = 300` (~5 сек) через Безье.
- **Показ:** `RESPONSE_PAUSE_MS = 7000` (7 сек).
- **Исчезновение:** `RESPONSE_FRAMES = 300` через Безье.
- **Шрифт:** `FONT_TOM`.
- **Перенос:** по словам, через `view.measureText` + `view.drawTextLine`.
- **Отступы:** масштабируются под ширину экрана через `getTomResponseMetrics`. Отступ — 6% ширины (мин 16px), шрифт — 5.5% ширины (зажат в `[16, 48]`px), межстрочный — 1.35 от шрифта. Стартовая Y — 22% высоты.
- **Разблокировка:** `isLocked = false` только в конце `animateAIResponseOut`.

---

## 9. Сетевой слой

### 9.1. OCR — Tesseract.js

- Языки: `rus`, `eng`.
- Без фильтрации. Отдаёт всё, что распознал — включая мусор.
- Назначение OCR: только `findEasterEgg` + `validate` (guardrails). В ИИ OCR-текст уходит как `prompt` (в историю), картинка — отдельно.
- После успешного OCR: `CanvasPresenter` сохраняет `bufferedCanvas.toDataURL('image/png')` в `IDiaryModel.pendingImage`.
- OCR запускается параллельно с анимацией впитывания — не после неё. Воркер прогревается лениво при первом pointerdown. `recognize()` обёрнут в таймаут (15 сек).
- Если OCR вернул пусто: `pendingImage` не ставится, модель не дёргается, `isLocked = false`, `finalizeSession()`. **Ответа нет — как в каноне, дневник реагирует только на осмысленный ввод.**

### 9.2. Guardrails

- Регулярки на мат, спам, абьюз.
- `consecutiveIdenticalLimit: 3`, `consecutiveConsonantsLimit: 5`.
- Статичные ответы из `staticResponses.onAbuse` / `onSpam`.
- Ответы **в характере Тома** (ледяное превосходство, не человеческая злость).

### 9.3. Порядок обработки

1. **Пасхалка** (`findEasterEgg`) → если сработала, в ИИ не идём, `pendingImage` обнуляется.
2. **Guardrails** (`validate`) → если ABUSE/SPAM, в ИИ не идём, `pendingImage` обнуляется, ставится статичный ответ.
3. **Лимиты** (`rateLimiter.canProceed()`) → если превышено, в ИИ не идём, `isLocked = false`, **ответа нет**.
4. **Проверка** `pendingImage` → если пусто, в ИИ не идём.
5. **Всё чисто** → `rateLimiter.record()` → `AIClientService.sendMessage(pendingImage, cleanedText)`.

### 9.4. DeepSeek Vision

- **Модель:** `deepseek-flash` (принимает картинки base64).
- **Схема:** холст → base64 → прокси → DeepSeek → ответ.
- **Формат запроса:** `messages = [...history, { role: 'user', content: [text?, image_url?] }]`.
- **Лимиты:** 10/мин, 100/день, бан 3 часа, счётчик в `localStorage`.

### 9.5. AIClientService

- Хранит `messageHistory: IChatMessage[]`.
- `historyLimit = 11` (1 system + 5 пар: 5 user + 5 assistant).
- При переполнении — `splice(1, 2)` (убирает старейшую **пару**, не одну реплику).
- Промт из `langConfig.persona.systemPrompt` при создании и при `setLanguage`.
- `setLanguage(config)` — чистит историю и кладёт новый system-промт.
- `sendMessage(prompt, imageBase64)`:
  - **снимок** `messageHistory` до fetch,
  - POST к прокси с `{ prompt, image, history }`,
  - парсит `choices[0].message.content`, **trim**,
  - если пусто → возвращает `''`, **не пушит пару**,
  - иначе → `pushPair(prompt, reply)`.
- `pushPair` — пушит user + assistant одновременно, с `splice(1, 2)` при переполнении.

---

## 10. Пасхалки

### 10.1. Архитектура движка

Дерево `src/easterEggs/`:

- `IEasterEgg.ts`
- `EasterEggRegistry.ts`
- `config/lore.hp.config.ts` — ЛОРНЫЙ конфиг (цвета, пропорции, тайминги)
- `shared/Bezier.ts`
- `shared/RunFrames.ts`
- `shared/RenderText.ts`
- `shared/RenderCipher.ts`
- `shared/AppearPauseDisappear.ts`
- `shared/BaseImageEgg.ts`
- `shared/ReducedMotion.ts`
- `effects/AvadaKedavra.ts`
- `effects/Hogwarts.ts`
- `effects/Gryffindor.ts`
- `effects/Slytherin.ts`
- `effects/Ravenclaw.ts`
- `effects/Hufflepuff.ts`
- `effects/Nagini.ts`
- `effects/Imperio.ts`
- `effects/Crucio.ts`

### 10.2. Границы

- **`effects/`** — код конкретных пасхалок. Индивидуальная логика. Трогается только когда меняешь эту пасхалку.
- **`shared/` + `EasterEggRegistry` + `IEasterEgg`** — движок. Общий. Не трогается при смене лора.
- **`config/lore.hp.config.ts`** — лорный конфиг. Меняется при смене лора.
- **`config/lore.hp.ts`** — регистрация. Место, где пасхалки подключаются к реестру.
- **`config/lang.*.ts` → `easterEggs`** — конфиг лора. Триггеры, ответы, `overlayText`, `finalize`, `persistentArtifacts`.

### 10.3. Регистрация

Вынесена в `config/lore.hp.ts`. `main.ts` вызывает `registerLore()`.

### 10.4. Конфиг пасхалки (в `lang.*.ts`)

Поля:

- `trigger: RegExp`
- `response: string`
- `finalize: 'default' | 'never-returns'`
- `persistentArtifacts: boolean`
- `keepImageAfterFade?: boolean`
- `overlayText?: string`

### 10.5. Реализованные пасхалки

| Пасхалка | Тип | Финал | Картинка | Особенности |
|---|---|---|---|---|
| AvadaKedavra | `avada_kedavra` | never-returns | нет | зелёная вспышка, вибрация, бесконечный `requestAnimationFrame` |
| Hogwarts | `hogwarts` | default | да | 4 факультета, картинка |
| Gryffindor | `gryffindor` | default | да | |
| Slytherin | `slytherin` | default | да | |
| Ravenclaw | `ravenclaw` | default | да | |
| Hufflepuff | `hufflepuff` | default | да | |
| Nagini | `nagini` | default | да | Theban-шифр |
| Imperio | `imperio` | default | да | `overlayText` |
| Crucio | `crucio` | default | да | трещины до перезагрузки |

### 10.6. Ослабление регулярок пасхалок

`src/config/normalize.ts` — `normalizeToRu` / `normalizeToEn`. `AppPresenter.findEasterEgg` прогоняет текст через нормализацию до проверки.

- `normalizeToRu` меняет латинские визуальные двойники (`a, b, e, k, m, h, o, p, c, t, y, x`) на русские.
- `normalizeToEn` — наоборот.
- Ловит Круцио, Империо, Нагайна.

### 10.7. Связь с ядром

- `CanvasPresenter.handleModelUpdate` ловит `diaryModel.easterEgg`, находит эффект в `EasterEggRegistry`, вызывает `egg.execute(ctx, ...)`.
- `ctx` берётся через `this.view.getContext()` — точка расширения.
- Пасхалки не знают про `ICanvasView`. Ядро не знает про пасхалки.

---

## 11. Локализация

- `langRU`: `rus`, русские тексты.
- `langEN`: `eng`, английские тексты.
- Пасхалки в конфиге с регулярками.
- Nagini: ответ на английском, отображается в Theban-шифре независимо от локали.
- Imperio: `trigger`, `response`, `overlayText` — в обоих языках.
- При смене языка `AppPresenter.handleLanguageToggle` вызывает `aiClient.setLanguage(nextConfig)` — история ИИ чистится, промт подменяется.

---

## 12. Credits

Идея и **формула кривых Безье** для впитывания чернил и анимации письма — из проекта [**riddle**](https://github.com/MaximeRivest/riddle) от [Maxime Rivest](https://github.com/MaximeRivest). Дневник Тома Реддла для reMarkable Paper Pro: перо, впитывание чернил в страницу, ответ Тома, который пишется штрих за штрихом, память страниц, takeover-режим поверх e-ink.

**Взято:**

- **Формула кривых Безье** для впитывания и анимации письма — перенесена на 2D-canvas.
- **Идея** — «магический дневник»: пауза после письма → впитывание → раздумье → ответ → исчезновение, без чат-UI.

**Всё остальное — с нуля под веб:**

- **Платформа:** браузер вместо reMarkable, Vanilla TS + Vite вместо Rust, Canvas 2D вместо e-ink waveform.
- **Ввод:** палец / мышь / клавиатура + Tesseract OCR вместо evdev-пера.
- **ИИ:** DeepSeek Vision вместо OpenAI-совместимого эндпоинта.
- **Пасхалки:** изолированный слой `src/easterEggs/`, 9 эффектов по лору Гарри Поттера. В оригинале пасхалок нет.
- **Лор:** вынесен в конфиг, меняется за 15 минут. В оригинале промт зашит в `src/oracle.rs`.

**Лицензии:**

- [riddle](https://github.com/MaximeRivest/riddle) — MIT, © Maxime Rivest. Из него взята формула кривых Безье.
- **Horcrux Diary** — GPL-3.0. MIT-код riddle совместим с GPL-3.0: он включён в проект на условиях MIT, всё остальное — под GPL-3.0.

---

## 13. Сборка и деплой

- **Установка:** `npm install`.
- **Дев:** `npm run dev`.
- **Билд:** `npm run build` (Vite 8 + rolldown).
- **Output:** `dist/`.
- **Assets:** в `public/assets/`.
- **Vercel:** проект `horcrux-diary`, team `Agehachou`. Autodeploy: `git push` в `main` → Vercel пересобирает.
- **Env:** `VITE_WORKER_URL` — URL прокси. Type: Config, Environments: Production + Preview + Development. Применяется только к новым деплоям — после добавления сделать Redeploy.
- **`.env.local`** (в `.gitignore`): `VITE_WORKER_URL=...`
- **`.env.example`** — шаблон в репозитории.

---

## 14. Известные проблемы

- Tesseract путает буквы в рукописных шрифтах.
- OCR на телефоне при вводе пальцем — плохо распознаёт. Это осознанное поведение: нечитаемый ввод игнорируется. Для гарантированного ответа — клавиатура.
- Нагайна: размер шрифта и `lineHeight` требуют подбора.
- Preflight-кэш браузера (24 часа) — при первом провале CORS браузер запоминает на сутки. Лечится перезагрузкой или `Max-Age = 600`.
- **Приложение работает только через VPN.** Vercel блокируется провайдерами в РФ. Осознанное решение — не обходить, аудитория готова к VPN.

---

## 15. Лицензия

**Horcrux Diary** распространяется под [GNU GPL v3.0](https://www.gnu.org/licenses/gpl-3.0.html).

Проект использует формулу кривых Безье из [riddle](https://github.com/MaximeRivest/riddle) (MIT, © Maxime Rivest). MIT-код совместим с GPL-3.0: он включён в проект на условиях MIT, а всё остальное — под GPL-3.0.