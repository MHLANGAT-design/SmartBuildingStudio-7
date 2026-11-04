using System;
using System.Collections.Generic;

namespace CommissioningService.Api.Contracts.Responses;

public class CommissioningSessionResponse
{
    public Guid SessionId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid FloorplanId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string StartedBy { get; set; } = string.Empty;
    
    // Flattened lists for the frontend
    public List<CommissioningDeviceResponse> Devices { get; set; } = new();
    public List<CommissioningFaultResponse> Defects { get; set; } = new();
}