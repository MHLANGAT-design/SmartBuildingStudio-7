using System;
using System.Collections.Generic;

namespace CommissioningService.Api.Contracts.Requests;

public class DeployProgrammingRequest
{
    public string PlanId { get; set; } = string.Empty;
    public string DesignRevisionId { get; set; } = string.Empty;
    public string GatewayId { get; set; } = string.Empty;
    public string TargetLineId { get; set; } = string.Empty;
    public List<ProgrammingSequenceDto> Sequences { get; set; } = new();
}

public class ProgrammingSequenceDto
{
    public string SequenceId { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
    public int Address { get; set; }
    public List<ProgrammingCommandDto> Commands { get; set; } = new();
}

public class ProgrammingCommandDto
{
    public string CommandType { get; set; } = string.Empty;   // RESET, ASSIGN_ADDRESS, SET_LEVEL, ...
    public int Parameter1 { get; set; }
    public int Parameter2 { get; set; }
    public int? FadeTime { get; set; }
}