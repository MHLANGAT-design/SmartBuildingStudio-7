// GatewayManagementService.Api/Controllers/GatewayIntegrationController.cs

using GatewayManagementService.Application.Interfaces;
using GatewayManagementService.Infrastructure.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace GatewayManagementService.Api.Controllers;

[ApiController]
[Route("api/v1/gateway-integration")]
public sealed class GatewayIntegrationController : ControllerBase
{
    private readonly IGatewayIntegrationService _integration;
    private readonly IOptions<GatewayIntegrationOptions> _options;

    public GatewayIntegrationController(
        IGatewayIntegrationService integration,
        IOptions<GatewayIntegrationOptions> options)
    {
        _integration = integration;
        _options = options;
    }

    [HttpGet("state")]
    public ActionResult<object> GetState()
    {
        return Ok(new
        {
            useMock = _options.Value.UseMock,
            healthCheckIntervalSeconds = _options.Value.HealthCheckIntervalSeconds,
            maxReconnectAttempts = _options.Value.MaxReconnectAttempts
        });
    }

    [HttpPost("{id:guid}/ping")]
    public async Task<ActionResult<bool>> Ping(Guid id, CancellationToken cancellationToken)
    {
        var ok = await _integration.PingAsync(id, cancellationToken);
        return Ok(ok);
    }
}