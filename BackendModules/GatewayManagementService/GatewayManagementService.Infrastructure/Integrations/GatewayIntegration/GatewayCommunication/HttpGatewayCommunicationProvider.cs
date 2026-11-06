// GatewayManagementService.Infrastructure/Integrations/GatewayIntegration/GatewayCommunication/HttpGatewayCommunicationProvider.cs

using System.Net.Http.Headers;
using System.Text;

namespace GatewayManagementService.Infrastructure.Integrations.GatewayIntegration.GatewayCommunication;

public sealed class HttpGatewayCommunicationProvider : IGatewayCommunicationProvider
{
    private readonly HttpClient _http;

    public HttpGatewayCommunicationProvider(HttpClient http)
    {
        _http = http;
    }

    public async Task<bool> PingAsync(string endpoint, CancellationToken cancellationToken = default)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"http://{endpoint}/health");
            using var response = await _http.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<string> SendAsync(string endpoint, string payload, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"http://{endpoint}/command");
        request.Content = new StringContent(payload, Encoding.UTF8);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        using var response = await _http.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}