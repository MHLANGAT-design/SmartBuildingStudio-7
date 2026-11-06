// GatewayManagementService.Api/Contracts/Responses/GatewayResponse.cs

namespace GatewayManagementService.Api.Contracts.Responses;

public sealed class GatewayResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
    public string Transport { get; set; } = string.Empty;
    public string DaliProtocol { get; set; } = string.Empty;
    public string EndpointHost { get; set; } = string.Empty;
    public int EndpointPort { get; set; }
    public string? EndpointPath { get; set; }
    public string ConnectionStatus { get; set; } = string.Empty;
    public DateTime? LastConnectedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public string? LastErrorMessage { get; set; }
    public int DaliLineCount { get; set; }
    public int PollingIntervalSeconds { get; set; }
    public int CommandTimeoutSeconds { get; set; }
}