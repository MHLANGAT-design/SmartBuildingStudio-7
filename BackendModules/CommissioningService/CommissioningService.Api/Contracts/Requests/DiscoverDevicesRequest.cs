using System;

namespace CommissioningService.Api.Contracts.Requests;

public class DiscoverDevicesRequest
{
    public Guid SessionId { get; set; }
    public string GatewayId { get; set; } = string.Empty;
    public string LineId { get; set; } = string.Empty;
}