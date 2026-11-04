namespace CommissioningService.Api.Configuration;

public class CommissioningOptions
{
    public const string SectionName = "Commissioning";

    /// <summary>
    /// The maximum allowed duration for a session before it is auto-abandoned.
    /// </summary>
    public int MaxSessionDurationHours { get; set; } = 24;

    /// <summary>
    /// Whether to use mock gateways (for local dev without physical hardware).
    /// </summary>
    public bool UseMockGateway { get; set; } = true;
    
    /// <summary>
    /// URLs for integration services
    /// </summary>
    public string GatewayManagementUrl { get; set; } = string.Empty;
    public string ProjectExplorerUrl { get; set; } = string.Empty;
}