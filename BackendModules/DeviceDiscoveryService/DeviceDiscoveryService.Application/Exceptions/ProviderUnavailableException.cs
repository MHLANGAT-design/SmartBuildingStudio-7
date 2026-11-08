// Exceptions/ProviderUnavailableException.cs

namespace DeviceDiscoveryService.Application.Exceptions;

/// <summary>
/// Thrown when an outbound provider (GatewayManagement, ProjectExplorer)
/// is unreachable or returns an error. Surfaces as 503 in the API.
/// </summary>
public sealed class ProviderUnavailableException : ApplicationExceptionBase
{
    public string ProviderName { get; }

    public ProviderUnavailableException(string providerName, string message)
        : base($"{providerName} is unavailable: {message}")
    {
        ProviderName = providerName;
    }

    public ProviderUnavailableException(string providerName, string message, Exception inner)
        : base($"{providerName} is unavailable: {message}", inner)
    {
        ProviderName = providerName;
    }
}