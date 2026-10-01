import type { IStrokePoint, IStrokeService } from "../types";

export class StrokeService implements IStrokeService {
  // Наш массив-хранилище, куда мы будем складывать все точки
  private points: IStrokePoint[] = [];

  // Сюда мы сейчас будем добавлять инструменты
  clear() {
    this.points = [];
  }

  getPoints() {
    return this.points;
  }

  addPoint(pixelX: number, pixelY: number, canvasWidth: number, canvasHeight: number, isNew: boolean) {
    let x = pixelX / canvasWidth;
    let y = pixelY / canvasHeight;

    this.points.push({x, y, isNew});
  }
}
