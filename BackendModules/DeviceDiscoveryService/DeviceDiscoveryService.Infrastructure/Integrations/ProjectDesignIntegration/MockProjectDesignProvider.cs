// Integrations/ProjectDesignIntegration/MockProjectDesignProvider.cs

using DeviceDiscoveryService.Application.Interfaces;

namespace DeviceDiscoveryService.Infrastructure.Integrations.ProjectDesignIntegration;

/// <summary>
/// Mock provider — returns 3 synthetic design fixtures per line so that
/// the 3 mock discovered devices match cleanly (same addresses, same line).
/// Used when UseMockIntegrations = true.
/// </summary>
public sealed class MockProjectDesignProvider : IProjectDesignProvider
{
    public async Task<IReadOnlyList<RawDesignFixture>> GetFixturesForLineAsync(
        Guid projectId,
        Guid drawingDocumentId,
        string lineId,
        CancellationToken cancellationToken = default)
    {
        await Task.Delay(100, cancellationToken);

        return new[]
        {
            new RawDesignFixture(
                FixtureId: $"{lineId}-fx-001",
                ProductId: "prod-mock-001",
                ProductName: "Mock Luminaire A",
                DaliGroup: "1",
                ShortAddress: 1,
                X: 100, Y: 100,
                LineId: lineId),
            new RawDesignFixture(
                FixtureId: $"{lineId}-fx-002",
                ProductId: "prod-mock-001",
                ProductName: "Mock Luminaire A",
                DaliGroup: "1",
                ShortAddress: 2,
                X: 200, Y: 100,
                LineId: lineId),
            new RawDesignFixture(
                FixtureId: $"{lineId}-fx-003",
                ProductId: "prod-mock-002",
                ProductName: "Mock Luminaire B",
                DaliGroup: "2",
                ShortAddress: 3,
                X: 300, Y: 100,
                LineId: lineId),
        };
    }

    public Task<IReadOnlyList<RawDesignFixture>> GetFixturesForFloorAsync(
        Guid projectId,
        Guid floorId,
        CancellationToken cancellationToken = default)
    {
        // The mock doesn't know which lines belong to the floor, so it
        // returns an empty list here. Line-scoped calls supply the real data.
        return Task.FromResult<IReadOnlyList<RawDesignFixture>>(Array.Empty<RawDesignFixture>());
    }
}