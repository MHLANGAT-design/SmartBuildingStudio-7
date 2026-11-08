// Entities/DeviceMatch.cs

namespace DeviceDiscoveryService.Domain.Entities;

public sealed class DeviceMatch
{
    public DeviceMatchId Id { get; private set; }

    /// <summary>The discovered device being matched.</summary>
    public DiscoveredDeviceId DeviceId { get; private set; }

    /// <summary>
    /// The design fixture the device was matched to (from ProjectExplorer).
    /// Null when the device is unmatched.
    /// </summary>
    public string? FixtureId { get; private set; }

    public MatchStatus Status { get; private set; }

    /// <summary>0.0–1.0. Higher means more confident this is the right fixture.</summary>
    public double? Confidence { get; private set; }

    /// <summary>Human-readable list of differences between design and physical device.</summary>
    public IReadOnlyList<string> Discrepancies { get; private set; } = Array.Empty<string>();

    public DateTime MatchedAt { get; private set; }

    private DeviceMatch(
        DeviceMatchId id,
        DiscoveredDeviceId deviceId,
        string? fixtureId,
        MatchStatus status,
        double? confidence,
        IReadOnlyList<string> discrepancies,
        DateTime matchedAt)
    {
        Id = id;
        DeviceId = deviceId;
        FixtureId = fixtureId;
        Status = status;
        Confidence = confidence;
        Discrepancies = discrepancies;
        MatchedAt = matchedAt;
    }

    public static DeviceMatch Create(
        DiscoveredDeviceId deviceId,
        string? fixtureId,
        MatchStatus status,
        DateTime matchedAt,
        double? confidence = null,
        IEnumerable<string>? discrepancies = null)
    {
        if (status == MatchStatus.Matched() && string.IsNullOrWhiteSpace(fixtureId))
            throw new ArgumentException("Matched result requires a FixtureId.", nameof(fixtureId));

        if (confidence is < 0 or > 1)
            throw new ArgumentOutOfRangeException(nameof(confidence), "Confidence must be between 0 and 1.");

        return new DeviceMatch(
            DeviceMatchId.New(),
            deviceId,
            fixtureId,
            status,
            confidence,
            (discrepancies ?? Array.Empty<string>()).ToList().AsReadOnly(),
            matchedAt);
    }

    // EF Core
    private DeviceMatch() { }
}