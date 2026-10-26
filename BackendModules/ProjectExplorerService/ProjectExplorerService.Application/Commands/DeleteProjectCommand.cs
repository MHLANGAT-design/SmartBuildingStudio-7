namespace ProjectExplorerService.Application.Commands;

public record DeleteProjectCommand(Guid Id);

public class DeleteProjectCommandHandler
{
    public Task HandleAsync(DeleteProjectCommand command)
    {
        return Task.CompletedTask;
    }
}
