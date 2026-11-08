// Persistence/Providers/SystemDateTimeProvider.cs

using DeviceDiscoveryService.Application.Interfaces;

namespace DeviceDiscoveryService.Infrastructure.Persistence.Providers;

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}