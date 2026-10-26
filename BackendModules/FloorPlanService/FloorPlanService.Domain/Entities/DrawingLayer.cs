using FloorPlanService.Domain.Common;
using FloorPlanService.Domain.Enums;
namespace FloorPlanService.Domain.Entities;
public class DrawingLayer : EntityBase
{
    public string Name { get; private set; }
    public LayerType Type { get; private set; }
    public bool IsVisible { get; private set; } = true;
    public DrawingLayer(string name, LayerType type)
    {
        Name = name;
        Type = type;
    }
}
