using System;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.Entities;

public sealed class GatewayConnectionRecord : Entity<Guid>
{
    public DateTime ConnectedAt { get; private set; }
    public DateTime? DisconnectedAt { get; private set; }
    public string? DisconnectReason { get; private set; }
    public string? RemoteEndpoint { get; private set; }

    private GatewayConnectionRecord() { }

    public GatewayConnectionRecord(string? remoteEndpoint)
    {
        Id = Guid.NewGuid();
        ConnectedAt = DateTime.UtcNow;
        RemoteEndpoint = remoteEndpoint;
    }

    public void Close(string? reason)
    {
        DisconnectedAt = DateTime.UtcNow;
        DisconnectReason = reason;
    }

    public bool IsOpen => DisconnectedAt == null;
}