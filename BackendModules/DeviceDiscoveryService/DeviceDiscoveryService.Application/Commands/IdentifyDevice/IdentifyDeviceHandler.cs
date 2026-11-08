// Commands/IdentifyDevice/IdentifyDeviceHandler.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Application.Interfaces;
using DeviceDiscoveryService.Application.Mapping;
using DeviceDiscoveryService.Domain.Exceptions;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.Services;
using DeviceDiscoveryService.Domain.ValueObjects;
using MediatR;

namespace DeviceDiscoveryService.Application.Commands.IdentifyDevice;

public sealed class IdentifyDeviceHandler
    : IRequestHandler<IdentifyDeviceCommand, DiscoveredDeviceDto>
{
    private readonly IDiscoverySessionRepository _repository;
    private readonly IDeviceIdentificationDomainService _identificationService;
    private readonly IDateTimeProvider _clock;

    public IdentifyDeviceHandler(
        IDiscoverySessionRepository repository,
        IDeviceIdentificationDomainService identificationService,
        IDateTimeProvider clock)
    {
        _repository = repository;
        _identificationService = identificationService;
        _clock = clock;
    }

    public async Task<DiscoveredDeviceDto> Handle(
        IdentifyDeviceCommand request,
        CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(
                          new DiscoverySessionId(request.SessionId), cancellationToken)
                      ?? throw new DiscoverySessionNotFoundException(request.SessionId);

        var ident = _identificationService.BuildIdentification(
            request.Gtin,
            request.Manufacturer,
            request.Model,
            request.FirmwareVersion,
            request.SerialNumber,
            request.DeviceType,
            _clock.UtcNow);

        session.RegisterIdentification(new DiscoveredDeviceId(request.DeviceId), ident, _clock.UtcNow);
        await _repository.UpdateAsync(session, cancellationToken);

        var device = session.Devices.First(d => d.Id.Value == request.DeviceId);
        return device.ToDto();
    }
}