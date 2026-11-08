// Aggregates/DiscoverySession.cs

using System;
using System.Collections.Generic;
using System.Linq;

namespace DeviceDiscoveryService.Domain.Aggregates;

/// <summary>
/// The aggregate root for a discovery run.
///
/// Owns: discovered devices, their identifications, their matches, and the
///       history of state changes.
/// Lifecycle: Idle → Discovering → (Identifying) → (Matching) → Completed
///            Idle → Discovering → Stopped  (partial results kept)
///            Idle → Discovering → Failed   (terminal)
///            Idle/Discovering → Cancelled  (terminal, results discarded)
///
/// All state transitions go through methods that enforce the guards below.
/// No handler sets Status directly.
/// </summary>
public sealed class DiscoverySession
{
    private readonly List<DiscoveredDevice> _devices = new();
    private readonly List<DiscoveryHistoryEntry> _history = new();
    private readonly List<IDomainEvent> _domainEvents = new();

    public DiscoverySessionId Id { get; private set; }

    // ProjectExplorer references — stored as plain ids, not FKs
    public Guid ProjectId { get; private set; }
    public Guid BuildingId { get; private set; }
    public Guid FloorId { get; private set; }
    public Guid DrawingDocumentId { get; private set; }

    public DiscoveryScope Scope { get; private set; } = null!;
    public DiscoveryStatus Status { get; private set; } = null!;

    public string? StartedBy { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? StartedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public DateTime? FailedAt { get; private set; }
    public string? FailureReason { get; private set; }

    public IReadOnlyCollection<DiscoveredDevice> Devices => _devices.AsReadOnly();
    public IReadOnlyCollection<DiscoveryHistoryEntry> History => _history.AsReadOnly();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public int DeviceCount => _devices.Count;
    public int MatchedCount => _devices.Count(d => d.Match?.Status == MatchStatus.Matched());

    // EF Core
    private DiscoverySession() { }

    private DiscoverySession(
        DiscoverySessionId id,
        Guid projectId,
        Guid buildingId,
        Guid floorId,
        Guid drawingDocumentId,
        DiscoveryScope scope,
        string? startedBy,
        DateTime createdAt)
    {
        Id = id;
        ProjectId = projectId;
        BuildingId = buildingId;
        FloorId = floorId;
        DrawingDocumentId = drawingDocumentId;
        Scope = scope;
        StartedBy = startedBy;
        CreatedAt = createdAt;
        Status = DiscoveryStatus.Idle();
    }

    // ─── Factory ──────────────────────────────────────────────────────

    public static DiscoverySession Create(
        Guid projectId,
        Guid buildingId,
        Guid floorId,
        Guid drawingDocumentId,
        DiscoveryScope scope,
        string? startedBy,
        DateTime now)
    {
        if (projectId == Guid.Empty) throw new ArgumentException("ProjectId is required.", nameof(projectId));
        if (floorId == Guid.Empty) throw new ArgumentException("FloorId is required.", nameof(floorId));
        if (scope is null) throw new ArgumentNullException(nameof(scope));

        var session = new DiscoverySession(
            DiscoverySessionId.New(),
            projectId,
            buildingId,
            floorId,
            drawingDocumentId,
            scope,
            startedBy,
            now);

        session.AddHistory("Created", now,
            $"Session created for gateway '{scope.GatewayId}' / {scope.LineIds.Count} line(s).");

        return session;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────

    public void StartDiscovery(DateTime now)
    {
        if (Status != DiscoveryStatus.Idle())
            throw new DiscoverySessionInvalidStateException(
                $"Cannot start discovery. Session is in {Status.Value} state.");

        Status = DiscoveryStatus.Discovering();
        StartedAt = now;
        AddHistory("StartDiscovery", now, null);
    }

    public void RegisterDevice(DiscoveredDevice device, DateTime now)
    {
        if (Status != DiscoveryStatus.Discovering())
            throw new DiscoverySessionInvalidStateException(
                $"Devices can only be registered while in the Discovering state (current: {Status.Value}).");

        if (device is null) throw new ArgumentNullException(nameof(device));

        // Idempotent by ExternalId + Address
        var existing = _devices.FirstOrDefault(d =>
            string.Equals(d.ExternalId, device.ExternalId, StringComparison.Ordinal) &&
            d.Address.Equals(device.Address));

        if (existing is not null)
        {
            existing.MarkSeen(now, device.IsOnline);
            return;
        }

        _devices.Add(device);
    }

    public void RegisterIdentification(DiscoveredDeviceId deviceId, DeviceIdentification identification, DateTime now)
    {
        if (identification is null) throw new ArgumentNullException(nameof(identification));

        var device = _devices.FirstOrDefault(d => d.Id == deviceId)
                     ?? throw new DiscoveredDeviceNotFoundException(deviceId.Value);

        device.AttachIdentification(identification);

        _domainEvents.Add(new DeviceIdentifiedEvent(
            Id,
            deviceId,
            device.ExternalId,
            identification.Status,
            now));

        AddHistory("IdentifyDevice", now,
            $"Device {device.ExternalId} → {identification.Status.Value}.");
    }

    public void RegisterMatch(DiscoveredDeviceId deviceId, DeviceMatch match, DateTime now)
    {
        if (match is null) throw new ArgumentNullException(nameof(match));

        var device = _devices.FirstOrDefault(d => d.Id == deviceId)
                     ?? throw new DiscoveredDeviceNotFoundException(deviceId.Value);

        device.AttachMatch(match);

        AddHistory("MatchDevice", now,
            $"Device {device.ExternalId} → {match.Status.Value}"
            + (match.FixtureId is null ? "" : $" ({match.FixtureId})")
            + ".");
    }

    public void BeginIdentification(DateTime now)
    {
        if (Status != DiscoveryStatus.Discovering())
            throw new DiscoverySessionInvalidStateException(
                $"Cannot begin identification. Session is in {Status.Value} state.");
        Status = DiscoveryStatus.Identifying();
        AddHistory("BeginIdentification", now, null);
    }

    public void BeginMatching(DateTime now)
    {
        if (Status != DiscoveryStatus.Identifying()
            && Status != DiscoveryStatus.Discovering())
            throw new DiscoverySessionInvalidStateException(
                $"Cannot begin matching. Session is in {Status.Value} state.");
        Status = DiscoveryStatus.Matching();
        AddHistory("BeginMatching", now, null);
    }

    public void CompleteDiscovery(DateTime now)
    {
        if (Status != DiscoveryStatus.Matching()
            && Status != DiscoveryStatus.Identifying()
            && Status != DiscoveryStatus.Discovering())
            throw new DiscoverySessionInvalidStateException(
                $"Cannot complete discovery. Session is in {Status.Value} state.");

        if (_devices.Count == 0)
            throw new DiscoverySessionInvalidStateException(
                "Cannot complete discovery because no devices were found.");

        Status = DiscoveryStatus.Completed();
        CompletedAt = now;
        AddHistory("CompleteDiscovery", now,
            $"Discovered {_devices.Count} device(s), matched {MatchedCount}.");

        _domainEvents.Add(new DiscoveryCompletedEvent(Id, _devices.Count, MatchedCount, now));
    }

    public void StopDiscovery(DateTime now)
    {
        if (Status != DiscoveryStatus.Discovering()
            && Status != DiscoveryStatus.Identifying()
            && Status != DiscoveryStatus.Matching())
            throw new DiscoverySessionInvalidStateException(
                $"Cannot stop discovery. Session is in {Status.Value} state.");

        Status = DiscoveryStatus.Stopped();
        CompletedAt = now;
        AddHistory("StopDiscovery", now,
            $"Stopped with {_devices.Count} device(s) registered.");
    }

    public void FailDiscovery(string reason, DateTime now)
    {
        if (Status.IsTerminal)
            throw new DiscoverySessionInvalidStateException(
                $"Cannot fail discovery. Session is already terminal ({Status.Value}).");

        Status = DiscoveryStatus.Failed();
        FailedAt = now;
        FailureReason = reason ?? string.Empty;
        AddHistory("FailDiscovery", now, reason);

        _domainEvents.Add(new DiscoveryFailedEvent(Id, reason ?? string.Empty, now));
    }

    public void CancelDiscovery(DateTime now)
    {
        if (Status.IsTerminal)
            throw new DiscoverySessionInvalidStateException(
                $"Cannot cancel discovery. Session is already terminal ({Status.Value}).");

        Status = DiscoveryStatus.Cancelled();
        AddHistory("CancelDiscovery", now, null);
    }

    // ─── Internals ────────────────────────────────────────────────────

    private void AddHistory(string eventType, DateTime occurredAt, string? details)
    {
        _history.Add(DiscoveryHistoryEntry.Create(eventType, occurredAt, details));
    }

    public void ClearDomainEvents() => _domainEvents.Clear();

    // ─── EF Core collection accessors ─────────────────────────────────

    internal IReadOnlyList<DiscoveredDevice> DevicesInternal => _devices;
    internal IReadOnlyList<DiscoveryHistoryEntry> HistoryInternal => _history;
}