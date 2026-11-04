using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Integrations.ReportsIntegration;

public class ReportsClient
{
    private readonly HttpClient _httpClient;
    public ReportsClient(HttpClient httpClient) => _httpClient = httpClient;

    public async Task<string> GeneratePdfAsync(string reportJson, CancellationToken cancellationToken)
    {
        var response = await _httpClient.PostAsync("/api/reports/generate", new StringContent(reportJson), cancellationToken);
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}