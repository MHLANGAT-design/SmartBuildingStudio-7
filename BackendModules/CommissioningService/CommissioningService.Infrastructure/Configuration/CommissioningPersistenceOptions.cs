namespace CommissioningService.Infrastructure.Configuration;

public class CommissioningPersistenceOptions
{
    public const string SectionName = "Persistence";
    public string ConnectionString { get; set; } = string.Empty;
}