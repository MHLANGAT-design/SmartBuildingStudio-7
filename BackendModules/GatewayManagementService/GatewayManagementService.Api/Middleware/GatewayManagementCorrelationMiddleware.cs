// GatewayManagementService.Api/Middleware/GatewayManagementCorrelationMiddleware.cs

namespace GatewayManagementService.Api.Middleware;

public sealed class GatewayManagementCorrelationMiddleware
{
    public const string HeaderName = "X-Correlation-Id";

    private readonly RequestDelegate _next;

    public GatewayManagementCorrelationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(HeaderName, out var value)
            ? value.ToString()
            : Guid.NewGuid().ToString("N");

        context.TraceIdentifier = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (context.RequestServices.GetRequiredService<ILoggerFactory>()
                   .CreateLogger("Correlation")
                   .BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId }))
        {
            await _next(context);
        }
    }
}