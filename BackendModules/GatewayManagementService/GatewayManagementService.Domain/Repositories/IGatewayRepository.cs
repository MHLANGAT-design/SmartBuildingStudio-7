using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using GatewayManagementService.Domain.Aggregates;
using GatewayManagementService.Domain.ValueObjects;

namespace GatewayManagementService.Domain.Repositories;

public interface IGatewayRepository
{
    Task<Gateway?> GetByIdAsync(GatewayId id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Gateway>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Gateway>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task AddAsync(Gateway gateway, CancellationToken cancellationToken = default);
    Task UpdateAsync(Gateway gateway, CancellationToken cancellationToken = default);
    Task DeleteAsync(GatewayId id, CancellationToken cancellationToken = default);
}