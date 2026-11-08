// Policies/MatchingPolicy.cs

using System.Collections.Generic;
using System.Linq;

namespace DeviceDiscoveryService.Domain.Policies;

/// <summary>
/// Pure rules: given the set of candidate fixture matches for a device,
/// what should the final MatchStatus and Confidence be?
/// </summary>
public static class MatchingPolicy
{
    public readonly record struct Candidate(string FixtureId, double Score, IReadOnlyList<string>? Differences);

    public sealed record Result(MatchStatus Status, string? FixtureId, double? Confidence, IReadOnlyList<string> Discrepancies);

    public static Result Evaluate(IReadOnlyList<Candidate> candidates)
    {
        if (candidates.Count == 0)
            return new Result(MatchStatus.Unmatched(), null, null, Array.Empty<string>());

        var ordered = candidates.OrderByDescending(c => c.Score).ToList();
        var best = ordered[0];

        // Two candidates within a small threshold → ambiguous
        if (ordered.Count >= 2)
        {
            var second = ordered[1];
            if (System.Math.Abs(best.Score - second.Score) < 0.10)
            {
                return new Result(
                    MatchStatus.Ambiguous(),
                    null,
                    best.Score,
                    new[] { $"Ambiguous: '{best.FixtureId}' and '{second.FixtureId}' have similar scores." });
            }
        }

        // A matched result must clear a minimum confidence threshold
        if (best.Score < 0.60)
            return new Result(MatchStatus.Unmatched(), null, best.Score, Array.Empty<string>());

        // If the candidate itself carried discrepancies, treat as conflict
        if (best.Differences is { Count: > 0 })
            return new Result(MatchStatus.Conflict(), best.FixtureId, best.Score, best.Differences);

        return new Result(MatchStatus.Matched(), best.FixtureId, best.Score, Array.Empty<string>());
    }
}