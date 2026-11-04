namespace CommissioningService.Infrastructure.Configuration;

public class GatewayIntegrationOptions
{
    public const string SectionName = "GatewayIntegration";
    public string BaseUrl { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
}