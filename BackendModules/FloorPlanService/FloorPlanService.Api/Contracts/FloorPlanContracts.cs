using System;
using System.Collections.Generic;

namespace FloorPlanService.API.Contracts
{
    public class BaseStyleContract
    {
        public string StrokeColor { get; set; } = "#4B5563";
        public string FillColor { get; set; } = "transparent";
        public double StrokeWidth { get; set; } = 1.5;
        public double Opacity { get; set; } = 1.0;
    }

    public class DrawingLayerContract
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool Visible { get; set; } = true;
        public bool Locked { get; set; } = false;
        public int Order { get; set; }
    }

    public class ImportedDrawingContract
    {
        public string Id { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSizeNumber { get; set; }
        public double ScaleFactor { get; set; } = 1.0;
        public double OffsetX { get; set; }
        public double OffsetY { get; set; }
        public double RotationDegrees { get; set; }
        public double Opacity { get; set; } = 0.5;
    }

    public class CSharpWallDto
    {
        public string Id { get; set; } = string.Empty;
        public string FloorId { get; set; } = string.Empty;
        public double StartX { get; set; }
        public double StartY { get; set; }
        public double EndX { get; set; }
        public double EndY { get; set; }
        public double Thickness { get; set; }
        public string Material { get; set; } = "Concrete";
        public BaseStyleContract Style { get; set; } = new();
    }

    public class CSharpDoorDto
    {
        public string Id { get; set; } = string.Empty;
        public string WallId { get; set; } = string.Empty;
        public string FloorId { get; set; } = string.Empty;
        public double Width { get; set; }
        public string DoorType { get; set; } = "Single Swing";
        public BaseStyleContract Style { get; set; } = new();
    }

    public class CSharpWindowDto
    {
        public string Id { get; set; } = string.Empty;
        public string WallId { get; set; } = string.Empty;
        public string FloorId { get; set; } = string.Empty;
        public double Width { get; set; }
        public double Transmittance { get; set; } = 0.75;
        public BaseStyleContract Style { get; set; } = new();
    }

    public class CSharpRoomDto
    {
        public string Id { get; set; } = string.Empty;
        public string FloorId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int TargetLux { get; set; } = 500;
        public int PrimaryGroup { get; set; }
        public List<CSharpVertexPoint> VertexPoints { get; set; } = new();
        public BaseStyleContract Style { get; set; } = new();
    }

    public class CSharpVertexPoint
    {
        public double X { get; set; }
        public double Y { get; set; }
    }

    public class FloorLevelContract
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int LevelIndex { get; set; }
        public double ElevationHeightMeters { get; set; }
        public List<CSharpWallDto> Walls { get; set; } = new();
        public List<CSharpRoomDto> Rooms { get; set; } = new();
        public List<CSharpDoorDto> Doors { get; set; } = new();
        public List<CSharpWindowDto> Windows { get; set; } = new();
    }

    /**
     * Unified payload mapping directly to the frontend serializer shape
     */
    public class ComprehensiveUpdateFloorPlanPayload
    {
        public string Name { get; set; } = string.Empty;
        public double PixelsToMetresScale { get; set; } = 1.0;
        public string ActiveFloorId { get; set; } = string.Empty;
        public List<DrawingLayerContract> Layers { get; set; } = new();
        public List<ImportedDrawingContract> ImportedDrawings { get; set; } = new();
        public List<FloorLevelContract> Floors { get; set; } = new();
    }
}
