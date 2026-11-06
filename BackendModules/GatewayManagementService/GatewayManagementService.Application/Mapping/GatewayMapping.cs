// GatewayManagementService.Application/Mapping/GatewayMapping.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Domain.Aggregates;

namespace GatewayManagementService.Application.Mapping;

public static class GatewayMapping
{
    public static GatewayDto ToDto(this Gateway gateway)
    {
        return new GatewayDto
        {
            Id = gateway.Id.Value,
            Name = gateway.Name.Value,
            Identifier = gateway.Identifier.Value,
            Transport = gateway.Transport.Value.ToString(),
            DaliProtocol = gateway.DaliProtocol.Value.ToString(),
            EndpointHost = gateway.Endpoint.Host,
            EndpointPort = gateway.Endpoint.Port,
            EndpointPath = gateway.Endpoint.Path,
            ConnectionStatus = gateway.ConnectionStatus.Value.ToString(),
            LastConnectedAt = gateway.LastConnectedAt,
            LastSeenAt = gateway.LastSeenAt,
            LastErrorMessage = gateway.LastErrorMessage,
            DaliLineCount = gateway.Configuration.DaliLineCount,
            PollingIntervalSeconds = gateway.Configuration.PollingIntervalSeconds,
            CommandTimeoutSeconds = gateway.Configuration.CommandTimeoutSeconds
        };
    }

    public static GatewayStatusDto ToStatusDto(this Gateway gateway)
    {
        return new GatewayStatusDto
        {
            GatewayId = gateway.Id.Value,
            ConnectionStatus = gateway.ConnectionStatus.Value.ToString(),
            LastConnectedAt = gateway.LastConnectedAt,
            LastSeenAt = gateway.LastSeenAt,
            LastErrorMessage = gateway.LastErrorMessage,
            IsReachable = gateway.ConnectionStatus.IsActive()
        };
    }
}