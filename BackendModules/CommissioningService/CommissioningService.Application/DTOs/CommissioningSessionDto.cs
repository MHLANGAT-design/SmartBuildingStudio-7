using System;
using System.Collections.Generic;

namespace CommissioningService.Application.DTOs;

public class CommissioningSessionDto
{
    public Guid SessionId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid FloorplanId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string StartedBy { get; set; } = string.Empty;
    
    public List<DeviceStateDto> Devices { get; set; } = new();
    public List<NetworkStateDto> NetworkStates { get; set; } = new();
    public List<FaultDto> ActiveFaults { get; set; } = new();
}