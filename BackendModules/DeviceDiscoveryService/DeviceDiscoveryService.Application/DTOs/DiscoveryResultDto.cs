// DTOs/DiscoveryResultDto.cs

namespace DeviceDiscoveryService.Application.DTOs;

public sealed class DiscoveryResultDto
{
    public Guid SessionId { get; init; }
    public int TotalDevices { get; init; }
    public int MatchedCount { get; init; }
    public int UnmatchedCount { get; init; }
    public int ConflictCount { get; init; }
    public int AmbiguousCount { get; init; }
    public List<DeviceMatchDto> Matches { get; init; } = new();
    public List<string> Exceptions { get; init; } = new();
}