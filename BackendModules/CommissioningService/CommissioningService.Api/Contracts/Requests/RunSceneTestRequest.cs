using System;
using System.Collections.Generic;

namespace CommissioningService.Api.Contracts.Requests;

public class RunSceneTestRequest
{
    public Guid SessionId { get; set; }
    public List<string> SceneIds { get; set; } = new();
}