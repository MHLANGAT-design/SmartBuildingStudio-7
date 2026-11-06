// GatewayManagementService.Api/Contracts/Requests/ExecuteGatewayOperationRequest.cs

namespace GatewayManagementService.Api.Contracts.Requests;

public sealed record ExecuteGatewayOperationRequest(
    string OperationType,
    string? Payload);