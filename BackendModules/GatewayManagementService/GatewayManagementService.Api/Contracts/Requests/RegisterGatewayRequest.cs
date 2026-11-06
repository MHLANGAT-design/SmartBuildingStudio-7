// GatewayManagementService.Api/Contracts/Requests/RegisterGatewayRequest.cs

namespace GatewayManagementService.Api.Contracts.Requests;

public sealed record RegisterGatewayRequest(
    string Name,
    string Identifier,
    string Transport,
    string DaliProtocol,
    string EndpointHost,
    int EndpointPort,
    string? EndpointPath,
    int DaliLineCount,
    int PollingIntervalSeconds,
    int CommandTimeoutSeconds,
    string? AuthToken);