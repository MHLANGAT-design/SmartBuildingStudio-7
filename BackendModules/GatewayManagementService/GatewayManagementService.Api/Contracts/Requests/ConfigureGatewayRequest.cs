// GatewayManagementService.Api/Contracts/Requests/ConfigureGatewayRequest.cs

namespace GatewayManagementService.Api.Contracts.Requests;

public sealed record ConfigureGatewayRequest(
    int DaliLineCount,
    int PollingIntervalSeconds,
    int CommandTimeoutSeconds,
    string? AuthToken);