// Integrations/GatewayDiscoveryIntegration/GatewayDiscoveryProvider.cs

using System.Text.Json;
using DeviceDiscoveryService.Application.Exceptions;
using DeviceDiscoveryService.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace DeviceDiscoveryService.Infrastructure.Integrations.GatewayDiscoveryIntegration;

/// <summary>
/// Real provider — hits GatewayManagement over HTTP and parses the
/// returned device list. Used when UseMockIntegrations = false.
/// </summary>
public sealed class GatewayDiscoveryProvider : IGatewayDiscoveryProvider
{
    private readonly GatewayDiscoveryClient _client;
    private readonly ILogger<GatewayDiscoveryProvider> _logger;

    public GatewayDiscoveryProvider(
        GatewayDiscoveryClient client,
        ILogger<GatewayDiscoveryProvider> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<IReadOnlyList<RawDiscoveredDevice>> ScanLineAsync(
        string gatewayId,
        string lineId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var responseJson = await _client.TriggerScanAsync(gatewayId, lineId, cancellationToken);
            return ParseDevices(responseJson, lineId);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex,
                "GatewayManagement scan failed for gateway {GatewayId} line {LineId}",
                gatewayId, lineId);
            throw new ProviderUnavailableException("GatewayManagement", ex.Message, ex);
        }
    }

    public Task<bool> PingGatewayAsync(string gatewayId, CancellationToken cancellationToken = default)
        => _client.PingAsync(gatewayId, cancellationToken);

    // ── Parse the operation response into RawDiscoveredDevice ────────
    //
    // GatewayManagement's /operations route returns an opaque string. The
    // shape depends on the adapter behind it. Support the common cases:
    //   - ["dev1","dev2"]
    //   - [{ "id": "dev1", "shortAddress": 3 }, ...]
    //   - { "devices": [ ... ] }
    private static IReadOnlyList<RawDiscoveredDevice> ParseDevices(string json, string lineId)
    {
        if (string.IsNullOrWhiteSpace(json)) return Array.Empty<RawDiscoveredDevice>();

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            JsonElement array = default;
            if (root.ValueKind == JsonValueKind.Array)
            {
                array = root;
            }
            else if (root.ValueKind == JsonValueKind.Object)
            {
                foreach (var key in new[] { "devices", "Devices", "result", "Result" })
                {
                    if (root.TryGetProperty(key, out var el) && el.ValueKind == JsonValueKind.Array)
                    {
                        array = el;
                        break;
                    }
                }
            }

            if (array.ValueKind != JsonValueKind.Array) return Array.Empty<RawDiscoveredDevice>();

            var list = new List<RawDiscoveredDevice>();
            foreach (var item in array.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String)
                {
                    list.Add(new RawDiscoveredDevice(item.GetString()!, lineId, null, true));
                }
                else if (item.ValueKind == JsonValueKind.Object)
                {
                    var id = item.TryGetProperty("id", out var idEl) ? idEl.GetString()
                           : item.TryGetProperty("externalId", out var extEl) ? extEl.GetString()
                           : null;
                    if (string.IsNullOrWhiteSpace(id)) continue;

                    int? shortAddr = null;
                    if (item.TryGetProperty("shortAddress", out var addrEl)
                        && addrEl.ValueKind == JsonValueKind.Number)
                    {
                        shortAddr = addrEl.GetInt32();
                    }

                    list.Add(new RawDiscoveredDevice(id!, lineId, shortAddr, true));
                }
            }
            return list;
        }
        catch (JsonException)
        {
            return Array.Empty<RawDiscoveredDevice>();
        }
    }
}