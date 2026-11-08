// Interfaces/ICurrentUserProvider.cs

namespace DeviceDiscoveryService.Application.Interfaces;

public interface ICurrentUserProvider
{
    /// <summary>
    /// The user making the request. Null when unauthenticated.
    /// </summary>
    string? GetCurrentUserId();
}