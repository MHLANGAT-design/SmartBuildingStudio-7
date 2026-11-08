// Events/IDomainEvent.cs

namespace DeviceDiscoveryService.Domain.Events;

/// <summary>
/// Marker interface for domain events raised by the aggregates.
/// Events are collected on the aggregate, then dispatched after save
/// (by a MediatR notification dispatcher or an outbox handler).
/// </summary>
public interface IDomainEvent { }