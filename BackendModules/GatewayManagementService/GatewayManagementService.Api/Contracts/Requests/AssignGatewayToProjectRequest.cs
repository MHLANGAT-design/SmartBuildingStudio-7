// GatewayManagementService.Api/Contracts/Requests/AssignGatewayToProjectRequest.cs

namespace GatewayManagementService.Api.Contracts.Requests;

public sealed record AssignGatewayToProjectRequest(
    Guid ProjectId,
    Guid? FloorId,
    Guid? DaliNetworkId);