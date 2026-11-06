// GatewayManagementService.Api/Contracts/Requests/UpdateGatewayRequest.cs

namespace GatewayManagementService.Api.Contracts.Requests;

public sealed record UpdateGatewayRequest(
    string Name,
    string EndpointHost,
    int EndpointPort,
    string? EndpointPath);