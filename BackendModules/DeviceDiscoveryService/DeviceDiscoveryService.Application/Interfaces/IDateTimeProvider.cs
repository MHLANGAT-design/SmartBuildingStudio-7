// Interfaces/IDateTimeProvider.cs

namespace DeviceDiscoveryService.Application.Interfaces;

/// <summary>
/// Abstraction over DateTime.UtcNow so tests can control time.
/// </summary>
public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}