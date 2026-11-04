using System;

namespace CommissioningService.Api.Contracts.Requests;

public class AssignDeviceAddressesRequest
{
    public Guid SessionId { get; set; }
    public string DeviceExternalId { get; set; } = string.Empty;
    public int Address { get; set; }
}