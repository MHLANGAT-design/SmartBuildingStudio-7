using System;

namespace CommissioningService.Api.Contracts.Responses;

public class CommissioningSignalResponse
{
    public Guid Id { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string SignalType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTime LoggedAt { get; set; }
}