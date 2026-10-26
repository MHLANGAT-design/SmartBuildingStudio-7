export class SpatialBounds {
  constructor(
    public minX = 0,
    public minY = 0,
    public maxX = 0,
    public maxY = 0
  ) {}

  public width(): number {
    return this.maxX - this.minX;
  }

  public height(): number {
    return this.maxY - this.minY;
  }

  public getCentroid(): { x: number; y: number } {
    return {
      x: (this.minX + this.maxX) / 2,
      y: (this.minY + this.maxY) / 2
    };
  }

  public clone(): SpatialBounds {
    return new SpatialBounds(this.minX, this.minY, this.maxX, this.maxY);
  }
}
