namespace FloorPlanService.Application.Projects.Commands;
public class DeleteProjectCommand 
{
    public Guid Id { get; set; }
    public DeleteProjectCommand(Guid id) => Id = id;
}
