using System;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.Entities;

public sealed class GatewayAssignment : Entity<Guid>
{
    public Guid ProjectId { get; private set; }
    public Guid? FloorId { get; private set; }
    public Guid? DaliNetworkId { get; private set; }
    public DateTime AssignedAt { get; private set; }

    private GatewayAssignment() { }

    public GatewayAssignment(Guid projectId, Guid? floorId, Guid? daliNetworkId)
    {
        Id = Guid.NewGuid();
        ProjectId = projectId;
        FloorId = floorId;
        DaliNetworkId = daliNetworkId;
        AssignedAt = DateTime.UtcNow;
    }
}