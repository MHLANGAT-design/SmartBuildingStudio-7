using System.Collections.Generic;

namespace FloorPlanService.Application.Contracts.Documents;

public record ElectricalFixtureDto(
    string Id,
    string Type,
    double X,
    double Y,
    Dictionary<string, object>? Properties
);