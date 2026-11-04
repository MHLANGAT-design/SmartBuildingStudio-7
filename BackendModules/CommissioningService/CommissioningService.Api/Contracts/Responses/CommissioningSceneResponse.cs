using System;

namespace CommissioningService.Api.Contracts.Responses;

public class CommissioningSceneResponse
{
    public Guid Id { get; set; }
    public string SceneId { get; set; } = string.Empty;
    public string SceneName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ExecutedAt { get; set; }
}