using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace CommissioningService.Infrastructure.Integrations.DeviceDiscoveryIntegration;

public class DeviceDiscoveryProvider : IDeviceDiscoveryProvider
{
    private readonly DeviceDiscoveryClient _client;
    private readonly DiscoveredDeviceMapper _mapper;
    private readonly ILogger<DeviceDiscoveryProvider> _logger;

    public DeviceDiscoveryProvider(
        DeviceDiscoveryClient client, 
        DiscoveredDeviceMapper mapper,
        ILogger<DeviceDiscoveryProvider> logger)
    {
        _client = client;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<IEnumerable<string>> DiscoverDevicesAsync(string gatewayId, string lineId, CancellationToken cancellationToken = default)
    {
        try
        {
            var responseJson = await _client.TriggerScanAsync(gatewayId, lineId, cancellationToken);
            
            if (string.IsNullOrWhiteSpace(responseJson))
            {
                return new List<string>();
            }

            return _mapper.MapResponseToDeviceIds(responseJson);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to discover devices on line {LineId} for gateway {GatewayId}", lineId, gatewayId);
            return new List<string>();
        }
    }
}