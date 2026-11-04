using System.Collections.Generic;
using System.Text.Json;

namespace CommissioningService.Infrastructure.Integrations.DeviceDiscoveryIntegration;

public class DiscoveredDeviceMapper
{
    public IEnumerable<string> MapResponseToDeviceIds(string jsonResponse)
    {
        return new List<string>();
    }
}