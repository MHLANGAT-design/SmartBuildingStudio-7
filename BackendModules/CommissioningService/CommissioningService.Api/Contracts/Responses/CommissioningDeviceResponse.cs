using System;

namespace CommissioningService.Api.Contracts.Responses;

public class CommissioningDeviceResponse
{
    public Guid Id { get; set; }
    public string ExternalId { get; set; } = string.Empty; // e.g., 'fx-179...'
    public int? ShortAddress { get; set; }
    public string CommunicationStatus { get; set; } = string.Empty;
    public bool IsAddressed { get; set; }
}