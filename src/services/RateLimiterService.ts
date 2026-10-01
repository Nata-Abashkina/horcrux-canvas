// src/services/RateLimiterService.ts
// Клиентские лимиты: 10/мин, 100/день, бан 3 часа. Всё в localStorage.

const STORAGE_KEY = 'diary-rate-limiter';

const LIMIT_PER_MINUTE = 10;
const LIMIT_PER_DAY = 100;
const BAN_MS = 3 * 60 * 60 * 1000; // 3 часа
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

interface ILimiterState {
  minuteStart: number;
  minuteCount: number;
  dayStart: number;
  dayCount: number;
  banUntil: number; // 0 — не забанен
}

function now(): number {
  return Date.now();
}

function defaultState(): ILimiterState {
  return {
    minuteStart: now(),
    minuteCount: 0,
    dayStart: now(),
    dayCount: 0,
    banUntil: 0,
  };
}

export class RateLimiterService {
  private state: ILimiterState;

  constructor() {
    this.state = this.load();
  }

  private load(): ILimiterState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw) as Partial<ILimiterState>;
      return {
        minuteStart: parsed.minuteStart ?? now(),
        minuteCount: parsed.minuteCount ?? 0,
        dayStart: parsed.dayStart ?? now(),
        dayCount: parsed.dayCount ?? 0,
        banUntil: parsed.banUntil ?? 0,
      };
    } catch {
      return defaultState();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // localStorage может быть недоступен (приватный режим) — молча игнорируем
    }
  }

  /**
   * Можно ли отправить запрос. Не мутирует состояние.
   */
  public canProceed(): boolean {
    const t = now();

    // Бан активен
    if (this.state.banUntil > t) return false;

    // Бан истёк — сбрасываем
    if (this.state.banUntil > 0 && this.state.banUntil <= t) {
      this.state.banUntil = 0;
      this.save();
    }

    // Сбрасываем минутное окно
    if (t - this.state.minuteStart >= MINUTE_MS) {
      this.state.minuteStart = t;
      this.state.minuteCount = 0;
    }

    // Сбрасываем дневное окно
    if (t - this.state.dayStart >= DAY_MS) {
      this.state.dayStart = t;
      this.state.dayCount = 0;
    }

    if (this.state.minuteCount >= LIMIT_PER_MINUTE) {
      // Превышение минуты → бан 3 часа
      this.state.banUntil = t + BAN_MS;
      this.save();
      return false;
    }

    if (this.state.dayCount >= LIMIT_PER_DAY) {
      // Превышение дня → бан 3 часа
      this.state.banUntil = t + BAN_MS;
      this.save();
      return false;
    }

    return true;
  }

  /**
   * Записать успешный запрос. Вызывать только если canProceed() === true.
   */
  public record(): void {
    this.state.minuteCount += 1;
    this.state.dayCount += 1;
    this.save();
  }
}