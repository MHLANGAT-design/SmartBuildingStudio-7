// GatewayManagementService.Api/Contracts/Responses/GatewayOperationResponse.cs

namespace GatewayManagementService.Api.Contracts.Responses;

public sealed class GatewayOperationResponse
{
    public Guid Id { get; set; }
    public Guid GatewayId { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public string? Payload { get; set; }
    public string? Result { get; set; }
    public bool Succeeded { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
}