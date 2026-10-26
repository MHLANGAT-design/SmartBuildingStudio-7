using ProjectExplorerService.Application.Dtos;

namespace ProjectExplorerService.Application.Queries;

public record GetNodeStatisticsQuery(Guid? NodeId);

public class GetNodeStatisticsQueryHandler
{
    public Task<EngineeringStatisticsDto> HandleAsync(GetNodeStatisticsQuery query)
    {
        return Task.FromResult(new EngineeringStatisticsDto(0, 0, 0, 0));
    }
}
