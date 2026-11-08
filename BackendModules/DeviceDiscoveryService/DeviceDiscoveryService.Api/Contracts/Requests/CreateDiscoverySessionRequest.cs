// Contracts/Requests/CreateDiscoverySessionRequest.cs

namespace DeviceDiscoveryService.Api.Contracts.Requests;

public sealed class CreateDiscoverySessionRequest
{
    public Guid ProjectId { get; set; }
    public Guid BuildingId { get; set; }
    public Guid FloorId { get; set; }
    public Guid DrawingDocumentId { get; set; }
    public string GatewayId { get; set; } = string.Empty;
    public List<string> LineIds { get; set; } = new();
    public string? StartedBy { get; set; }
}