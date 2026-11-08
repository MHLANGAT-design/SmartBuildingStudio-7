// Contracts/Responses/DiscoveryResultResponse.cs

using DeviceDiscoveryService.Application.DTOs;

namespace DeviceDiscoveryService.Api.Contracts.Responses;

public sealed class DiscoveryResultResponse
{
    public Guid SessionId { get; set; }
    public int TotalDevices { get; set; }
    public int MatchedCount { get; set; }
    public int UnmatchedCount { get; set; }
    public int ConflictCount { get; set; }
    public int AmbiguousCount { get; set; }
    public List<DeviceMatchResponse> Matches { get; set; } = new();
    public List<string> Exceptions { get; set; } = new();

    public static DiscoveryResultResponse FromDto(DiscoveryResultDto dto) => new()
    {
        SessionId = dto.SessionId,
        TotalDevices = dto.TotalDevices,
        MatchedCount = dto.MatchedCount,
        UnmatchedCount = dto.UnmatchedCount,
        ConflictCount = dto.ConflictCount,
        AmbiguousCount = dto.AmbiguousCount,
        Matches = dto.Matches.Select(m => new DeviceMatchResponse
        {
            Id = m.Id,
            DeviceId = m.DeviceId,
            FixtureId = m.FixtureId,
            Status = m.Status,
            Confidence = m.Confidence,
            Discrepancies = m.Discrepancies,
            MatchedAt = m.MatchedAt,
        }).ToList(),
        Exceptions = dto.Exceptions,
    };
}