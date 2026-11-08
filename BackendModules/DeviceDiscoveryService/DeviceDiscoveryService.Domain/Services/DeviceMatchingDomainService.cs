// Services/DeviceMatchingDomainService.cs

using System;
using System.Collections.Generic;
using System.Linq;
using DeviceDiscoveryService.Domain.Entities;
using DeviceDiscoveryService.Domain.Policies;

namespace DeviceDiscoveryService.Domain.Services;

public sealed class DeviceMatchingDomainService : IDeviceMatchingDomainService
{
    public DeviceMatch MatchSingle(
        DiscoveredDevice device,
        IReadOnlyList<DesignFixtureSnapshot> fixtures,
        DateTime matchedAt)
    {
        if (device is null) throw new ArgumentNullException(nameof(device));
        if (fixtures is null || fixtures.Count == 0)
        {
            return DeviceMatch.Create(
                device.Id, null, MatchStatus.Unmatched(), matchedAt);
        }

        var candidates = new List<MatchingPolicy.Candidate>();

        foreach (var fixture in fixtures)
        {
            var differences = new List<string>();

            // Compare physical short address
            if (device.Address.ShortAddress.HasValue && fixture.ShortAddress.HasValue
                && device.Address.ShortAddress.Value != fixture.ShortAddress.Value)
            {
                differences.Add(
                    $"Address mismatch: physical {device.Address.ShortAddress}, design {fixture.ShortAddress}.");
            }

            // Compare identification (manufacturer/model if available)
            var ident = device.Identification;
            if (ident is not null)
            {
                if (!string.IsNullOrWhiteSpace(ident.Model)
                    && !string.IsNullOrWhiteSpace(fixture.ProductName)
                    && !string.Equals(ident.Model, fixture.ProductName, StringComparison.OrdinalIgnoreCase))
                {
                    differences.Add($"Model differs: '{ident.Model}' vs design '{fixture.ProductName}'.");
                }
            }

            // Simple confidence model — extend later with distances, position, etc.
            var score = ComputeScore(device, fixture, differences.Count == 0);

            candidates.Add(new MatchingPolicy.Candidate(fixture.FixtureId, score, differences));
        }

        var decision = MatchingPolicy.Evaluate(candidates);

        return DeviceMatch.Create(
            device.Id,
            decision.FixtureId,
            decision.Status,
            matchedAt,
            decision.Confidence,
            decision.Discrepancies);
    }

    private static double ComputeScore(
        DiscoveredDevice device,
        DesignFixtureSnapshot fixture,
        bool noDifferences)
    {
        // Base: perfect score if fields matched with no discrepancies
        if (noDifferences) return 1.0;

        // If we only saw different short address but same model — partial
        return 0.75;
    }
}