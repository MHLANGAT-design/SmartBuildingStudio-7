namespace ProjectExplorerService.Application.Dtos;

public record EngineeringStatisticsDto(
    int TotalProjects,
    int TotalBuildings,
    int TotalFloors,
    int TotalDocuments
);
