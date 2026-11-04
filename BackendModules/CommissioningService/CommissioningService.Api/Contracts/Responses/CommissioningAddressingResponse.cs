using System;

namespace CommissioningService.Api.Contracts.Responses;

public class CommissioningAddressingResponse
{
    public Guid AssignmentId { get; set; }
    public string DeviceExternalId { get; set; } = string.Empty;
    public int ShortAddress { get; set; }
    public bool IsVerified { get; set; }
}