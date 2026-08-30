import type { IInputView } from "../types";

export class InputView implements IInputView {
  // 1. Объявляем приватные свойства — это «карманы», где класс будет хранить инструменты
  private ctx: CanvasRenderingContext2D;
  private langButton: HTMLButtonElement;
   // 2. Конструктор — это функция, которая срабатывает ОДИН раз в момент создания принтера
  constructor(canvas: HTMLCanvasElement, button: HTMLButtonElement) {
    // Забираем у холста его 2D-контекст (это и есть наш пульт управления рисованием)
    const context = canvas.getContext('2d');
      
    // Жесткая проверка: если контекст не удалось получить, проект должен упасть с понятной ошибкой
    if (!context) {
      throw new Error('Не удалось получить 2D контекст канваса');
    }

    // Прячем инструменты в карманы, чтобы другие методы класса имели к ним доступ через `this`
    this.ctx = context;
    this.langButton = button;
  }

  updateLangButton(localeName: string): void {
    // Напрямую меняем текст внутри HTML-кнопки
    this.langButton.textContent = localeName;
    this.langButton.setAttribute('data-lang', localeName.toLowerCase());
  }

  renderUserText(text: string, x: number, y: number, fontSize: number): void {
    // 1. Настраиваем шрифт: объединяем размер в пикселях и системное имя шрифта
    this.ctx.font = `${fontSize}px 'Special Elite'`;
     // 2. Задаем цвет букв: блеклые чернила Дневника (антрацитовый цвет)
    this.ctx.fillStyle = '#2b2b2b';

    // 3. Выжигаем пиксели текста на холсте по точным координатам
    this.ctx.fillText(text, x, y);
  }

  renderAIResponse(text: string, x: number, y: number, fontSize: number): void {
    // 1. Настраиваем каллиграфический шрифт Тома Реддла
    this.ctx.font = `${fontSize}px 'Gabriela Script'`;

    // 2. Задаем цвет: глубокие, свежие чернила Тома
    this.ctx.fillStyle = '#0a1128';

    // 3. Рисуем каллиграфический текст на холсте
    this.ctx.fillText(text, x, y);
  }
}
