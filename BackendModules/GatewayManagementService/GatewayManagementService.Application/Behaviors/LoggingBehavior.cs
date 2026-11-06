// GatewayManagementService.Application/Behaviors/LoggingBehavior.cs

using MediatR;
using Microsoft.Extensions.Logging;

namespace GatewayManagementService.Application.Behaviors;

public sealed class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var name = typeof(TRequest).Name;
        _logger.LogInformation("Handling {RequestName}: {@Request}", name, request);
        try
        {
            var response = await next();
            _logger.LogInformation("Handled {RequestName}", name);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling {RequestName}", name);
            throw;
        }
    }
}