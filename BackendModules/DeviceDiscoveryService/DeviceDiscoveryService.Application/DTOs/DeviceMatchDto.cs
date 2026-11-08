// DTOs/DeviceMatchDto.cs

namespace DeviceDiscoveryService.Application.DTOs;

public sealed class DeviceMatchDto
{
    public Guid Id { get; init; }
    public Guid DeviceId { get; init; }
    public string? FixtureId { get; init; }
    public string Status { get; init; } = string.Empty;
    public double? Confidence { get; init; }
    public List<string> Discrepancies { get; init; } = new();
    public DateTime MatchedAt { get; init; }
}