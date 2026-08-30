import type { ICanvasView, IPixelPoint } from "../types";

export class CanvasView implements ICanvasView {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.ctx.font = "104px 'Special Elite'";
    this.ctx.measureText("");
  }

  public setDimensions(width: number, height: number, dpr: number): void {
    const canvas = this.ctx.canvas;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    canvas.style.backgroundImage = "url('./src/assets/parchment.webp')";
    canvas.style.backgroundSize = "cover";
    canvas.style.backgroundPosition = "center";

    this.ctx.scale(dpr, dpr);

    this.ctx.strokeStyle = "#2b2b2b";
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
  }

  public clear(width: number, height: number): void {
    this.ctx.clearRect(0, 0, width, height);
  }

  public drawStroke(pixelPoints: IPixelPoint[]): void {
    if (pixelPoints.length === 0) return;

    this.ctx.beginPath();
    for (let i = 0; i < pixelPoints.length; i++) {
      const point = pixelPoints[i];
      if (point.isNew) {
        this.ctx.moveTo(point.x, point.y);
      } else {
        this.ctx.lineTo(point.x, point.y);
      }
    }
    this.ctx.stroke();
  }

  /**
   * Стерильный рендер символа на растр холста для печатной машинки.
   * Выбор нужного шрифта (Special Elite / Gabriela Script) администрирует презентер.
   */
  public drawTextChar(char: string, x: number, y: number, font: string): void {
    this.ctx.font = font;
    this.ctx.fillStyle = "#2b2b2b";
    this.ctx.fillText(char, x, y);
  }

  public drawSnapshot(source: HTMLCanvasElement | HTMLImageElement): void {
    this.ctx.drawImage(source, 0, 0);
  }

  public setAlpha(alpha: number): void {
    this.ctx.globalAlpha = alpha;
  }

  public resetFilters(): void {
    this.ctx.globalAlpha = 1.0;
    
    this.ctx.strokeStyle = "#2b2b2b";
    this.ctx.lineWidth = 30;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
  }
}


















/*import type { ICanvasView, IPixelPoint } from "../types";

export class CanvasView implements ICanvasView {
  private ctx: CanvasRenderingContext2D;

private currentSessionPoints: IPixelPoint[] = [];


  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;




     this.ctx.font = "104px 'Special Elite'";
  // Заставляем Canvas бесшумно просчитать геометрию — это принудительно подтянет файл в память
  this.ctx.measureText(""); 
  }

  // 1. Адаптивное масштабирование под плотность пикселей любого экрана
  setDimensions(width: number, height: number, dpr: number): void {
    const canvas = this.ctx.canvas;

    // Увеличиваем внутреннюю матрицу под реальное разрешение устройства
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Ограничиваем физический размер элемента на экране в CSS-пикселях
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    canvas.style.backgroundImage = "url('./src/assets/parchment.webp')";
    canvas.style.backgroundSize = "cover";
    canvas.style.backgroundPosition = "center";

    // Масштабируем сетку, чтобы забыть про dpr при рисовании
    this.ctx.scale(dpr, dpr);

    // Жёстко фиксируем стиль чернил дневника Тома Реддла сразу после сброса контекста
    this.ctx.strokeStyle = "#2b2b2b"; 
    this.ctx.lineWidth = 5;            
    this.ctx.lineCap = "round";        
    this.ctx.lineJoin = "round";
  }

  // 2. Стерильная отрисовка: только готовые пиксели, никакой математики экрана
  drawStroke(pixelPoints: IPixelPoint[]): void {
    if (pixelPoints.length === 0) return;

    this.ctx.beginPath();

    for (const point of pixelPoints) {
      if (point.isNew) {
        this.ctx.moveTo(point.x, point.y);
      } else {
        this.ctx.lineTo(point.x, point.y);
      }
    }

    this.ctx.stroke();
  }

  // 3. Быстрая очистка холста
  clear(width: number, height: number): void {
    this.ctx.clearRect(0, 0, width, height);
  }

  drawTextChar(char: string, x: number, y: number): void {
  // Фиксируем шрифт дневника Тома Реддла для пользовательского ввода
  this.ctx.font = "104px 'Special Elite'";
  
  // Используем тот же цвет чернил дневника, что и для линий (#2b2b2b)
  this.ctx.fillStyle = "#2b2b2b";
  
  // Рендерим символ на холсте
  this.ctx.fillText(char, x, y);
}

















// Используем строгий тип IStrokePoint из техпаспорта
public drawStroke(pixelPoints: IPixelPoint[]): void {
  if (pixelPoints.length === 0) return;

  // Безопасный сбор точек текущего штриха без лагов spread-оператора
  for (let i = 0; i < pixelPoints.length; i++) {
    this.currentSessionPoints.push(pixelPoints[i]);
  }

  // Родная, проверенная логика отрисовки на холсте
  this.ctx.beginPath();
  for (let i = 0; i < pixelPoints.length; i++) {
    const point = pixelPoints[i];
    if (point.isNew) {
      this.ctx.moveTo(point.x, point.y);
    } else {
      this.ctx.lineTo(point.x, point.y);
    }
  }
  this.ctx.stroke();
}




  







public fadeAndClear(callback?: () => void): void {
  const canvas = this.ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // 1. Делаем один чистый слепок текста в буфер памяти
  const textBuffer = document.createElement('canvas');
  textBuffer.width = width;
  textBuffer.height = height;
  const tCtx = textBuffer.getContext('2d');
  if (!tCtx) return;
  tCtx.drawImage(canvas, 0, 0);

  let frame = 0;
  // Ваша идеальная slow-motion скорость: 180 кадров (~3 секунды монументального таяния)
  const totalFrames = 180; 

  const renderAbsorption = () => {
    // Чистим только холст прозрачностью, картинка пергамента сзади стоит монолитно
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.save();

    frame++;
    const progress = frame / totalFrames;

    // МАТЕМАТИКА КИНОШНОГО ВПИТЫВАНИЯ:
    // Прозрачность угасает по плавной кривой
    const currentOpacity = Math.pow(1.0 - progress, 1.8); 
    // Яркость чернил падает, заставляя их блекнуть неравномерно (от краев к центру)
    const currentBrightness = Math.max(0, 1.0 - progress * 1.2);

    // Прописываем фильтр изменения плотности пигмента и прозрачность прямо перед выводом кадра
    this.ctx.filter = `brightness(${currentBrightness})`;
    this.ctx.globalAlpha = currentOpacity;

    // Накатываем снимок текста из буфера строго на свои места
    this.ctx.drawImage(textBuffer, 0, 0);

    this.ctx.restore();

    if (frame < totalFrames) {
      requestAnimationFrame(renderAbsorption);
    } else {
      // Полный финал: буквы окончательно поглощены порами бумаги, тотальный сброс
      this.ctx.clearRect(0, 0, width, height);
      this.currentSessionPoints = [];
      if (callback) callback();
    }
  };

  // Запускаем мануальное кино
  requestAnimationFrame(renderAbsorption);
}




















  public clear(width: number, height: number): void {
    this.currentSessionPoints = []; // Обязательно сбрасываем кэш при грубой очистке
    this.ctx.clearRect(0, 0, width, height);
  }


}


/*import type { IStrokePoint, ICanvasView } from "../types";

export class CanvasView implements ICanvasView {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Не удалось получить 2D контекст канваса');
    }

    this.ctx = context;
  }

  clear(width: number, height: number): void {
    // Стираем всё от верхнего левого угла (0, 0) до правого нижнего (width, height)
    this.ctx.clearRect(0, 0, width, height);
  }

  setDimensions(width: number, height: number, dpr: number): void {
    // 1. Получаем ссылку на сам элемент холста из контекста
    const canvas = this.ctx.canvas;

    // 2. Увеличиваем внутреннее (физическое) разрешение холста под плотность пикселей
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // 3. Задаем визуальный размер холста на экране через стили (в обычных пикселях)
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // 4. Масштабируем сетку координат холста, чтобы нам не пришлось вручную умножать каждую точку на dpr
    this.ctx.scale(dpr, dpr);
  }

  drawStroke(points: IStrokePoint[], width: number, height: number): void {
    // Жесткая проверка: если точек нет или это одиночная точка, рисовать линию бессмысленно
    if (points.length < 2) return;

    // 1. Начинаем новый путь (сбрасываем старые линии, если они были в памяти холста)
    this.ctx.beginPath();

    // 2. Настраиваем внешний вид чернил
    this.ctx.strokeStyle = '#2b2b2b'; // Цвет блеклых чернил Дневника
    this.ctx.lineWidth = 2;            // Толщина линии в пикселях
    this.ctx.lineCap = 'round';        // Скругление на концах штриха
    this.ctx.lineJoin = 'round';       // Скругление на углах соединений

    // 3. Берем самую первую точку штриха, переводим проценты в пиксели и ставим туда перо
    const firstPoint = points[0];
    const startX = firstPoint.x * width;
    const startY = firstPoint.y * height;
    this.ctx.moveTo(startX, startY);

    // 4. Бежим циклом по всем остальным точкам и ведем к ним невидимые линии
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const currentX = point.x * width;
      const currentY = point.y * height;
      if (point.isNew) {
        this.ctx.moveTo(currentX, currentY);
      } else {
        this.ctx.lineTo(currentX, currentY);
      }
    }

    // 5. Команда «Обвести»: только в этот момент Canvas физически красит пиксели на экране
    this.ctx.stroke();
  }
}*/