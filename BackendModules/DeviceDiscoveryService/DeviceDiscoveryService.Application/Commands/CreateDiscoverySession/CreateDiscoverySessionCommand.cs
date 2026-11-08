// Commands/CreateDiscoverySession/CreateDiscoverySessionCommand.cs

using DeviceDiscoveryService.Application.DTOs;
using MediatR;

namespace DeviceDiscoveryService.Application.Commands.CreateDiscoverySession;

public sealed record CreateDiscoverySessionCommand(
    Guid ProjectId,
    Guid BuildingId,
    Guid FloorId,
    Guid DrawingDocumentId,
    string GatewayId,
    IReadOnlyList<string> LineIds,
    string? StartedBy) : IRequest<DiscoverySessionDto>;