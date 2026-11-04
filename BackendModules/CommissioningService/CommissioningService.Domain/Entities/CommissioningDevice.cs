using System;
using CommissioningService.Domain.Common;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Entities;

public class CommissioningDevice : Entity<CommissioningDeviceId>
{
    public string ExternalId { get; private set; } // e.g., the 'fx-179...' ID from the frontend
    public DeviceAddress? Address { get; private set; }
    public string CommunicationStatus { get; private set; } // Using string to map cleanly to frontend enums
    public DateTime? LastResponseAt { get; private set; }
    public string? FirmwareVersion { get; private set; }
    public int? ErrorCode { get; private set; }
    public bool IsAddressed { get; private set; }

    // EF Core constructor
    private CommissioningDevice() { }

    internal CommissioningDevice(CommissioningDeviceId id, string externalId)
    {
        Id = id;
        ExternalId = externalId;
        CommunicationStatus = "UNKNOWN";
        IsAddressed = false;
    }

    internal void AssignAddress(DeviceAddress address)
    {
        Address = address;
        IsAddressed = true;
    }

    internal void UpdateStatus(string status, string? firmware = null, int? errorCode = null)
    {
        CommunicationStatus = status;
        LastResponseAt = DateTime.UtcNow;
        FirmwareVersion = firmware ?? FirmwareVersion;
        ErrorCode = errorCode;
    }
}