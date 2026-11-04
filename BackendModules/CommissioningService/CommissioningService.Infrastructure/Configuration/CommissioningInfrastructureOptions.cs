namespace CommissioningService.Infrastructure.Configuration;

public class CommissioningInfrastructureOptions
{
    public const string SectionName = "Infrastructure";
    public bool UseMockIntegrations { get; set; } = true;
}