using System;
using System.Threading;
using System.Threading.Tasks;
using GatewayManagementService.Domain.Aggregates;
using GatewayManagementService.Domain.Exceptions;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;

namespace GatewayManagementService.Domain.Services;

public sealed class GatewayRegistrationDomainService
{
    private readonly IGatewayRepository _repository;

    public GatewayRegistrationDomainService(IGatewayRepository repository)
    {
        _repository = repository;
    }

    public async Task<Gateway> RegisterAsync(
        GatewayName name,
        GatewayIdentifier identifier,
        TransportProtocol transport,
        DaliProtocol daliProtocol,
        GatewayEndpoint endpoint,
        GatewayConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetAllAsync(cancellationToken);
        foreach (var g in existing)
        {
            if (g.Identifier.Value == identifier.Value)
            {
                throw new GatewayConfigurationException(
                    $"A gateway with identifier '{identifier.Value}' is already registered.");
            }
        }

        var gateway = new Gateway(
            GatewayId.New(),
            name,
            identifier,
            transport,
            daliProtocol,
            endpoint,
            configuration);

        await _repository.AddAsync(gateway, cancellationToken);
        return gateway;
    }
}