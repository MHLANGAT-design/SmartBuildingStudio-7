// Persistence/Providers/AnonymousCurrentUserProvider.cs

using DeviceDiscoveryService.Application.Interfaces;

namespace DeviceDiscoveryService.Infrastructure.Persistence.Providers;

/// <summary>
/// Fallback when no authentication pipeline is wired.
/// Replace with an HttpContextCurrentUserProvider when auth is added.
/// </summary>
public sealed class AnonymousCurrentUserProvider : ICurrentUserProvider
{
    public string? GetCurrentUserId() => "system";
}