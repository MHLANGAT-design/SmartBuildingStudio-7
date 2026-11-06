using System;
using System.Collections.Generic;
using GatewayManagementService.Domain.Common;
using GatewayManagementService.Domain.Entities;
using GatewayManagementService.Domain.Enums;
using GatewayManagementService.Domain.Events;
using GatewayManagementService.Domain.Exceptions;
using GatewayManagementService.Domain.ValueObjects;

namespace GatewayManagementService.Domain.Aggregates;

public sealed class Gateway : AggregateRoot<GatewayId>
{
    private readonly List<GatewayOperation> _operations = new();
    private readonly List<GatewayEvent> _events = new();
    private readonly List<GatewayConnectionRecord> _connectionHistory = new();
    private readonly List<GatewayAssignment> _assignments = new();

    public GatewayName Name { get; private set; }
    public GatewayIdentifier Identifier { get; private set; }
    public TransportProtocol Transport { get; private set; }
    public DaliProtocol DaliProtocol { get; private set; }
    public GatewayEndpoint Endpoint { get; private set; }
    public GatewayConfiguration Configuration { get; private set; }
    public ConnectionStatus ConnectionStatus { get; private set; }

    public DateTime? LastConnectedAt { get; private set; }
    public DateTime? LastSeenAt { get; private set; }
    public string? LastErrorMessage { get; private set; }

    public IReadOnlyCollection<GatewayOperation> Operations => _operations.AsReadOnly();
    public IReadOnlyCollection<GatewayEvent> Events => _events.AsReadOnly();
    public IReadOnlyCollection<GatewayConnectionRecord> ConnectionHistory => _connectionHistory.AsReadOnly();
    public IReadOnlyCollection<GatewayAssignment> Assignments => _assignments.AsReadOnly();

    private Gateway()
    {
        Name = default!;
        Identifier = default!;
        Transport = default!;
        DaliProtocol = default!;
        Endpoint = default!;
        Configuration = default!;
        ConnectionStatus = default!;
    }

    public Gateway(
        GatewayId id,
        GatewayName name,
        GatewayIdentifier identifier,
        TransportProtocol transport,
        DaliProtocol daliProtocol,
        GatewayEndpoint endpoint,
        GatewayConfiguration configuration)
    {
        Id = id;
        Name = name;
        Identifier = identifier;
        Transport = transport;
        DaliProtocol = daliProtocol;
        Endpoint = endpoint;
        Configuration = configuration;
        ConnectionStatus = ConnectionStatus.Disconnected;

        RaiseDomainEvent(new GatewayRegisteredEvent(id.Value, name.Value));
    }

    public void Rename(GatewayName name)
    {
        Name = name;
    }

    public void UpdateEndpoint(GatewayEndpoint endpoint)
    {
        Endpoint = endpoint;
    }

    public void UpdateConfiguration(GatewayConfiguration configuration)
    {
        Configuration = configuration;
        RaiseDomainEvent(new GatewayConfigurationChangedEvent(Id.Value));
    }

    public void BeginConnect()
    {
        if (ConnectionStatus == ConnectionStatus.Connected)
            throw new GatewayInvalidStateException("Gateway is already connected.");
        if (ConnectionStatus == ConnectionStatus.Connecting)
            throw new GatewayInvalidStateException("Gateway is already connecting.");

        ConnectionStatus = ConnectionStatus.Connecting;
    }

    public void MarkConnected()
    {
        if (ConnectionStatus == ConnectionStatus.Connected)
            return;

        ConnectionStatus = ConnectionStatus.Connected;
        LastConnectedAt = DateTime.UtcNow;
        LastSeenAt = DateTime.UtcNow;
        LastErrorMessage = null;

        var open = _connectionHistory.Find(r => r.IsOpen);
        if (open == null)
        {
            _connectionHistory.Add(new GatewayConnectionRecord(Endpoint.ToString()));
        }

        RaiseDomainEvent(new GatewayConnectedEvent(Id.Value));
    }

    public void MarkReconnected()
    {
        ConnectionStatus = ConnectionStatus.Connected;
        LastConnectedAt = DateTime.UtcNow;
        LastSeenAt = DateTime.UtcNow;
        LastErrorMessage = null;
        RaiseDomainEvent(new GatewayReconnectedEvent(Id.Value));
    }

    public void MarkError(string errorMessage)
    {
        ConnectionStatus = ConnectionStatus.Error;
        LastErrorMessage = errorMessage;
        _connectionHistory.Find(r => r.IsOpen)?.Close(errorMessage);
        RaiseDomainEvent(new GatewayDisconnectedEvent(Id.Value, errorMessage));
    }

    public void Touch()
    {
        LastSeenAt = DateTime.UtcNow;
    }

    public void Disconnect(string? reason)
    {
        if (ConnectionStatus == ConnectionStatus.Disconnected)
            return;

        ConnectionStatus = ConnectionStatus.Disconnected;
        _connectionHistory.Find(r => r.IsOpen)?.Close(reason);
        RaiseDomainEvent(new GatewayDisconnectedEvent(Id.Value, reason));
    }

    public GatewayOperation RecordOperation(GatewayOperationType operationType, string? payload)
    {
        var op = new GatewayOperation(operationType, payload);
        _operations.Add(op);
        return op;
    }

    public void RecordEvent(GatewayEventType eventType, string? message, string? payload)
    {
        _events.Add(new GatewayEvent(eventType, message, payload));
    }

    public GatewayAssignment AssignToProject(Guid projectId, Guid? floorId, Guid? daliNetworkId)
    {
        var existing = _assignments.Find(a =>
            a.ProjectId == projectId && a.FloorId == floorId && a.DaliNetworkId == daliNetworkId);
        if (existing != null) return existing;

        var assignment = new GatewayAssignment(projectId, floorId, daliNetworkId);
        _assignments.Add(assignment);
        return assignment;
    }

    public void UnassignFromProject(Guid assignmentId)
    {
        _assignments.RemoveAll(a => a.Id == assignmentId);
    }
}