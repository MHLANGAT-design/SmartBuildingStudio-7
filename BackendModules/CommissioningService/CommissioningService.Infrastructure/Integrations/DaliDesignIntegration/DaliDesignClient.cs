using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Integrations.DaliDesignIntegration;

public class DaliDesignClient
{
    private readonly HttpClient _httpClient;
    public DaliDesignClient(HttpClient httpClient) => _httpClient = httpClient;

    public async Task<string> GetDesignRevisionAsync(Guid floorplanId, CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync($"/api/dali/floorplans/{floorplanId}/revision", cancellationToken);
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}