// Policies/IdentificationPolicy.cs

using DeviceDiscoveryService.Domain.Entities;

namespace DeviceDiscoveryService.Domain.Policies;

/// <summary>
/// Pure rules: given the raw fields a gateway returned for one device,
/// what identification status do we assign?
/// </summary>
public static class IdentificationPolicy
{
    public static IdentificationStatus Evaluate(
        string? gtin,
        string? manufacturer,
        string? model,
        string? firmwareVersion)
    {
        var hasAny = !string.IsNullOrWhiteSpace(gtin)
                     || !string.IsNullOrWhiteSpace(manufacturer)
                     || !string.IsNullOrWhiteSpace(model)
                     || !string.IsNullOrWhiteSpace(firmwareVersion);

        if (!hasAny) return IdentificationStatus.Failed();

        var hasPrimary = !string.IsNullOrWhiteSpace(gtin)
                         && !string.IsNullOrWhiteSpace(manufacturer);

        if (hasPrimary) return IdentificationStatus.Succeeded();

        return IdentificationStatus.Partial();
    }

    public static IdentificationStatus Evaluate(DeviceIdentification identification)
        => identification.Status;
}