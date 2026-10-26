export class CoordinateSystem {
  constructor(
    public originX = 0,
    public originY = 0,
    public rotation = 0,
    public insertionBaseX = 0,
    public insertionBaseY = 0
  ) {}

  public clone(): CoordinateSystem {
    return new CoordinateSystem(
      this.originX,
      this.originY,
      this.rotation,
      this.insertionBaseX,
      this.insertionBaseY
    );
  }
}
