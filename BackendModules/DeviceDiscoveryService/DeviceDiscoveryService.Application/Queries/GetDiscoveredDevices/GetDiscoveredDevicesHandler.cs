// Queries/GetDiscoveredDevices/GetDiscoveredDevicesHandler.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Application.Mapping;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.ValueObjects;
using MediatR;

namespace DeviceDiscoveryService.Application.Queries.GetDiscoveredDevices;

public sealed class GetDiscoveredDevicesHandler
    : IRequestHandler<GetDiscoveredDevicesQuery, IReadOnlyList<DiscoveredDeviceDto>>
{
    private readonly IDiscoverySessionRepository _repository;

    public GetDiscoveredDevicesHandler(IDiscoverySessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<DiscoveredDeviceDto>> Handle(
        GetDiscoveredDevicesQuery request,
        CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(
            new DiscoverySessionId(request.SessionId), cancellationToken);

        if (session is null) return Array.Empty<DiscoveredDeviceDto>();

        return session.Devices.Select(d => d.ToDto()).ToList();
    }
}