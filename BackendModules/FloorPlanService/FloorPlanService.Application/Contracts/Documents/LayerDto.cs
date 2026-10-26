namespace FloorPlanService.Application.Contracts.Documents;

public record LayerDto(
    string Id,
    string Name,
    bool Visible,
    bool Locked,
    int Order
);