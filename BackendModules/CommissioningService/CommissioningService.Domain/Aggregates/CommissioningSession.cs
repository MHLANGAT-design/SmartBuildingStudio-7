using System;
using System.Collections.Generic;
using System.Linq;
using CommissioningService.Domain.Common;
using CommissioningService.Domain.Entities;
using CommissioningService.Domain.Events;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Aggregates;

public class CommissioningSession : AggregateRoot<CommissioningSessionId>
{
    // Private backing fields for EF Core
    private readonly List<CommissioningDevice> _devices = new();
    private readonly List<CommissioningDefect> _defects = new();
    private readonly List<CommissioningTest> _tests = new();
    private readonly List<AddressAssignment> _addressAssignments = new();
    private readonly List<NetworkState> _networkStates = new();
    private readonly List<SceneTest> _sceneTests = new();
    private readonly List<SignalLog> _signalLogs = new();

    // Properties
    public Guid ProjectId { get; private set; }
    public Guid FloorplanId { get; private set; }
    public CommissioningStatus Status { get; private set; } = CommissioningStatus.Idle;
    public DateTime StartedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public string StartedBy { get; private set; } = string.Empty;
    public string? ApprovedBy { get; private set; }

    // Navigation Properties
    public IReadOnlyCollection<CommissioningDevice> Devices => _devices.AsReadOnly();
    public IReadOnlyCollection<CommissioningDefect> Defects => _defects.AsReadOnly();
    public IReadOnlyCollection<CommissioningTest> Tests => _tests.AsReadOnly();
    public IReadOnlyCollection<AddressAssignment> AddressAssignments => _addressAssignments.AsReadOnly();
    public IReadOnlyCollection<NetworkState> NetworkStates => _networkStates.AsReadOnly();
    public IReadOnlyCollection<SceneTest> SceneTests => _sceneTests.AsReadOnly();
    public IReadOnlyCollection<SignalLog> SignalLogs => _signalLogs.AsReadOnly();

    private CommissioningSession() { }

    public static CommissioningSession Create(Guid projectId, Guid floorplanId, string startedBy)
    {
        var session = new CommissioningSession
        {
            Id = CommissioningSessionId.New(),
            ProjectId = projectId,
            FloorplanId = floorplanId,
            Status = CommissioningStatus.Idle,
            StartedAt = DateTime.UtcNow,
            StartedBy = startedBy
        };

        session.AddDomainEvent(new CommissioningSessionCreatedEvent(session.Id.Value, projectId, floorplanId, startedBy));
        return session;
    }

    // ── 1. Discovery Phase (state-transitioning, called from commissioning) ──

    public void StartDiscovery()
    {
        if (Status.Value != CommissioningStatus.StatusValue.Idle)
            throw new CommissioningSessionInvalidStateException("Discovery can only start from Idle state.");

        Status = CommissioningStatus.Discovering;
        AddDomainEvent(new CommissioningSessionStartedEvent(Id.Value));
    }

    public void RegisterDiscoveredDevice(CommissioningDeviceId deviceId, string externalId)
    {
        if (Status.Value != CommissioningStatus.StatusValue.Discovering)
            throw new CommissioningSessionInvalidStateException("Cannot register devices outside of the discovery phase.");

        if (_devices.Any(d => d.ExternalId == externalId)) return;

        var device = new CommissioningDevice(deviceId, externalId);
        _devices.Add(device);
    }

    public void CompleteDiscovery()
    {
        if (Status.Value != CommissioningStatus.StatusValue.Discovering)
            throw new CommissioningSessionInvalidStateException("Session is not in the discovery phase.");

        Status = CommissioningStatus.Addressing;
    }

    // ── 1b. Rescan (non-state-transitioning, called from programming) ─────

    public void RescanDevices(IEnumerable<string> discoveredExternalIds)
    {
        if (Status.Value == CommissioningStatus.StatusValue.Completed)
            throw new CommissioningSessionInvalidStateException(
                "Cannot rescan a completed session. Reset it first.");

        var discovered = new HashSet<string>(discoveredExternalIds);

        // Add new devices that weren't seen before
        foreach (var externalId in discovered)
        {
            if (_devices.Any(d => d.ExternalId == externalId)) continue;
            _devices.Add(new CommissioningDevice(CommissioningDeviceId.New(), externalId));
        }

        // Update the communication status of all currently-known devices
        foreach (var device in _devices)
        {
            if (discovered.Contains(device.ExternalId))
            {
                device.UpdateStatus("ONLINE");
            }
            else
            {
                device.UpdateStatus("OFFLINE");
            }
        }
    }

    // ── 2. Addressing Phase ──────────────────────────────────────────

    public void AssignDeviceAddress(CommissioningDeviceId deviceId, DeviceAddress address)
    {
        if (Status.Value != CommissioningStatus.StatusValue.Addressing)
            throw new CommissioningSessionInvalidStateException("Addresses can only be assigned during the addressing phase.");

        var device = _devices.FirstOrDefault(d => d.Id.Value == deviceId.Value)
            ?? throw new CommissioningDeviceNotFoundException(deviceId.Value.ToString());

        device.AssignAddress(address);

        var assignment = new AddressAssignment(device.ExternalId, "line-default", address.Value);
        assignment.MarkVerified();
        _addressAssignments.Add(assignment);

        AddDomainEvent(new DeviceAddressVerifiedEvent(Id.Value, device.Id.Value, address.Value));
    }

    // ── 2b. Forced re-addressing (used by DALI Programming module) ────
    // Bypasses the state machine so a device can be re-addressed after the
    // commissioning workflow has moved past the Addressing phase.
    public void ForceAssignDeviceAddress(CommissioningDeviceId deviceId, DeviceAddress address)
    {
        var device = _devices.FirstOrDefault(d => d.Id.Value == deviceId.Value)
            ?? throw new CommissioningDeviceNotFoundException(deviceId.Value.ToString());

        device.AssignAddress(address);

        // Replace any existing assignment record for this device.
        var existing = _addressAssignments.FirstOrDefault(a => a.DeviceId == device.ExternalId);
        if (existing != null) _addressAssignments.Remove(existing);

        var assignment = new AddressAssignment(device.ExternalId, "line-default", address.Value);
        assignment.MarkVerified();
        _addressAssignments.Add(assignment);

        AddDomainEvent(new DeviceAddressVerifiedEvent(Id.Value, device.Id.Value, address.Value));
    }

    public void BeginTesting()
    {
        if (Status.Value != CommissioningStatus.StatusValue.Addressing)
            throw new CommissioningSessionInvalidStateException("Session must be in Addressing state to begin Testing.");

        if (_devices.Any(d => !d.IsAddressed))
            throw new CommissioningSessionInvalidStateException("All devices must be addressed before testing can begin.");

        Status = CommissioningStatus.Testing;
    }

    // ── 3. Testing & Defects ─────────────────────────────────────────

    public void RegisterTest(CommissioningTestId testId, string testType, string targetId)
    {
        if (Status.Value != CommissioningStatus.StatusValue.Testing)
            throw new CommissioningSessionInvalidStateException("Tests can only be registered during the testing phase.");

        var test = new CommissioningTest(testId, testType, targetId);
        test.MarkRunning();
        _tests.Add(test);

        AddDomainEvent(new CommissioningTestStartedEvent(Id.Value, testId.Value, testType));
    }

    public void CompleteTest(CommissioningTestId testId, string result, long durationMs)
    {
        var test = _tests.FirstOrDefault(t => t.Id.Value == testId.Value)
            ?? throw new KeyNotFoundException("Test not found.");

        test.MarkCompleted();
        AddDomainEvent(new CommissioningTestCompletedEvent(Id.Value, testId.Value, result, durationMs));
    }

    public void RegisterDefect(string targetId, string category, string description, string severity)
    {
        var defect = new CommissioningDefect(Guid.NewGuid().ToString(), category, description, severity);
        _defects.Add(defect);

        AddDomainEvent(new CommissioningDefectRaisedEvent(Id.Value, defect.Id, targetId, severity));
    }

    public void ResolveDefect(CommissioningDefect defect, string resolvedBy)
    {
        defect.Resolve(resolvedBy);
        AddDomainEvent(new CommissioningDefectResolvedEvent(Id.Value, defect.Id, resolvedBy));
    }

    // ── 4. Scene Testing ─────────────────────────────────────────────

    public void RecordSceneTests(IEnumerable<SceneTest> results)
    {
        foreach (var test in results)
        {
            _sceneTests.Add(test);
            AddDomainEvent(new SceneTestCompletedEvent(Id.Value, test.SceneId, test.Status == "PASSED"));
        }
    }

    // ── 5. Completion & Approval ─────────────────────────────────────

    public void FinishCommissioning()
    {
        if (Status.Value != CommissioningStatus.StatusValue.Testing)
            throw new CommissioningSessionInvalidStateException("Only a session in the Testing state can be completed.");

        Status = CommissioningStatus.Completed;
        CompletedAt = DateTime.UtcNow;

        AddDomainEvent(new CommissioningSessionCompletedEvent(Id.Value));
    }

    public void ApproveSession(string approvedBy)
    {
        if (Status.Value != CommissioningStatus.StatusValue.Completed)
            throw new CommissioningSessionInvalidStateException("Only a Completed session can be Approved.");

        ApprovedAt = DateTime.UtcNow;
        ApprovedBy = approvedBy;

        AddDomainEvent(new CommissioningSessionApprovedEvent(Id.Value, approvedBy));
    }

    // ── 6. Lifecycle Controls (Pause, Stop, Reset) ───────────────────

    public void Pause()
    {
        if (Status.Value == CommissioningStatus.StatusValue.Completed)
            throw new CommissioningSessionInvalidStateException("Cannot pause a completed session.");
    }

    public void Stop()
    {
        if (Status.Value == CommissioningStatus.StatusValue.Completed)
            throw new CommissioningSessionInvalidStateException("Cannot stop a completed session.");

        Status = CommissioningStatus.Failed;
    }

    public void Reset()
    {
        Status = CommissioningStatus.Idle;
        _devices.Clear();
        _defects.Clear();
        _tests.Clear();
        _addressAssignments.Clear();
        _networkStates.Clear();
        _sceneTests.Clear();
        _signalLogs.Clear();

        CompletedAt = null;
        ApprovedAt = null;
        ApprovedBy = null;

        AddDomainEvent(new CommissioningSessionCreatedEvent(Id.Value, ProjectId, FloorplanId, StartedBy));
    }
}