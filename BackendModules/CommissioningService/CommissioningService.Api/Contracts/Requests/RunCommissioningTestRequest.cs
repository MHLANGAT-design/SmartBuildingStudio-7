using System;
using System.Collections.Generic;

namespace CommissioningService.Api.Contracts.Requests;

public class RunCommissioningTestRequest
{
    public Guid SessionId { get; set; }
    public string TestType { get; set; } = string.Empty;
    public List<string> TargetDeviceIds { get; set; } = new();
}