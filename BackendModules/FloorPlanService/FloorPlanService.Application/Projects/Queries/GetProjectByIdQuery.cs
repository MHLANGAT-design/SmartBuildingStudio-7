using MediatR;

namespace FloorPlanService.Application.Projects.Queries;

public class GetProjectByIdQuery : IRequest<object> // Change 'object' to your real Project model later
{
    public Guid Id { get; set; }
    public GetProjectByIdQuery(Guid id) => Id = id;
}
