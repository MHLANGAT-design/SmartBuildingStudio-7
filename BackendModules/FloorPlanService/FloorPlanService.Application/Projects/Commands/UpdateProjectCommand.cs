using MediatR; // Add this line

namespace FloorPlanService.Application.Projects.Commands;

public class UpdateProjectCommand : IRequest
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
