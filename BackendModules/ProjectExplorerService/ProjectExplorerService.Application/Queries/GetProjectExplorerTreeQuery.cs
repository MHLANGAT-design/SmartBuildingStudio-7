using ProjectExplorerService.Domain.Aggregates.ProjectAggregate;

namespace ProjectExplorerService.Application.Queries;

public record GetProjectExplorerTreeQuery() ;

// Implements typical MediatR style pattern handler
public class GetProjectExplorerTreeQueryHandler
{
    public Task<IEnumerable<Project>> HandleAsync(GetProjectExplorerTreeQuery query)
    {
        // Application logic processing mapping safely goes here
        return Task.FromResult(Enumerable.Empty<Project>());
    }
}
