// Integrations/ProjectDesignIntegration/ProjectDesignOptions.cs

namespace DeviceDiscoveryService.Infrastructure.Integrations.ProjectDesignIntegration;

public sealed class ProjectDesignOptions
{
    public const string SectionName = "ProjectDesign";

    public string BaseUrl { get; set; } = "http://localhost:5199";
    public int TimeoutSeconds { get; set; } = 30;
}