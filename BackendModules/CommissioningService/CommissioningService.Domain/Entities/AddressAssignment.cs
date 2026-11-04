using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Entities;

public class AddressAssignment : Entity<Guid>
{
    public string DeviceId { get; private set; }
    public string LineId { get; private set; }
    public int ShortAddress { get; private set; }
    public bool IsVerified { get; private set; }

    // EF Core constructor
    private AddressAssignment() { }

    internal AddressAssignment(string deviceId, string lineId, int shortAddress)
    {
        Id = Guid.NewGuid();
        DeviceId = deviceId;
        LineId = lineId;
        ShortAddress = shortAddress;
        IsVerified = false;
    }

    internal void MarkVerified()
    {
        IsVerified = true;
    }
}