namespace ProjectExplorerService.Application.Commands;

public record CreateProjectCommand(string ProjectNumber, string Name);

public class CreateProjectCommandHandler
{
    public Task<Guid> HandleAsync(CreateProjectCommand command)
    {
        return Task.FromResult(Guid.NewGuid());
    }
}
