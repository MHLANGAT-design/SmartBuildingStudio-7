using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Integrations.DaliProgrammingIntegration;

public class DaliProgrammingClient
{
    private readonly HttpClient _httpClient;
    public DaliProgrammingClient(HttpClient httpClient) => _httpClient = httpClient;

    public async Task<string> GetProgrammingStateAsync(Guid floorplanId, CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync($"/api/dali-programming/{floorplanId}/state", cancellationToken);
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}