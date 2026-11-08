// Repositories/IDiscoverySessionRepository.cs

using System.Threading;
using System.Threading.Tasks;

namespace DeviceDiscoveryService.Domain.Repositories;

public interface IDiscoverySessionRepository
{
    /// <summary>Loads the session including devices, identifications, matches and history.</summary>
    Task<DiscoverySession?> GetByIdAsync(DiscoverySessionId id, CancellationToken cancellationToken = default);

    /// <summary>Loads the session without navigation properties (fast path for status checks).</summary>
    Task<DiscoverySession?> GetAggregateRootByIdAsync(DiscoverySessionId id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DiscoverySession>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DiscoverySession>> GetByFloorAsync(Guid projectId, Guid floorId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DiscoverySession>> GetRecentAsync(int take, CancellationToken cancellationToken = default);

    Task AddAsync(DiscoverySession session, CancellationToken cancellationToken = default);
    Task UpdateAsync(DiscoverySession session, CancellationToken cancellationToken = default);
}