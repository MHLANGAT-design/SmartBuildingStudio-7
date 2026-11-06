using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Interfaces;
using GatewayManagementService.Application.Mapping;
using GatewayManagementService.Domain.Services;
using GatewayManagementService.Domain.ValueObjects;
using MediatR;

namespace GatewayManagementService.Application.Commands.RegisterGateway;

public sealed class RegisterGatewayHandler : IRequestHandler<RegisterGatewayCommand, GatewayDto>
{
    private readonly GatewayRegistrationDomainService _domainService;
    private readonly IGatewayAuditService _audit;

    public RegisterGatewayHandler(
        GatewayRegistrationDomainService domainService,
        IGatewayAuditService audit)
    {
        _domainService = domainService;
        _audit = audit;
    }

    public async Task<GatewayDto> Handle(RegisterGatewayCommand request, CancellationToken cancellationToken)
    {
        var transport = new TransportProtocol(
            Enum.Parse<TransportProtocol.ProtocolValue>(request.Transport, ignoreCase: true));
        var daliProtocol = new DaliProtocol(
            Enum.Parse<DaliProtocol.ProtocolValue>(request.DaliProtocol, ignoreCase: true));

        var gateway = await _domainService.RegisterAsync(
            new GatewayName(request.Name),
            new GatewayIdentifier(request.Identifier),
            transport,
            daliProtocol,
            new GatewayEndpoint(request.EndpointHost, request.EndpointPort, request.EndpointPath),
            new GatewayConfiguration(
                request.DaliLineCount,
                request.PollingIntervalSeconds,
                request.CommandTimeoutSeconds,
                request.AuthToken),
            cancellationToken);

        await _audit.RecordAsync(
            gateway.Id.Value,
            "GatewayRegistered",
            $"Gateway '{gateway.Name.Value}' registered.",
            cancellationToken);

        return gateway.ToDto();
    }
}