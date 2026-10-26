export interface CoordinateTransform {

    worldToScreen(point: Point2D): Point2D;

    screenToWorld(point: Point2D): Point2D;

    localToWorld(point: Point2D): Point2D;

    worldToLocal(point: Point2D): Point2D;
}