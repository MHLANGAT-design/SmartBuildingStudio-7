using System;
using System.Collections.Generic;
using MediatR;

namespace CommissioningService.Application.Commands.DeployProgramming;

public record DeployProgrammingCommand(
    Guid SessionId,
    string PlanId,
    string DesignRevisionId,
    string GatewayId,
    string TargetLineId,
    List<ProgrammingSequence> Sequences
) : IRequest<DeployProgrammingResult>;

public record ProgrammingSequence(
    string SequenceId,
    string DeviceId,
    int Address,
    List<ProgrammingCommand> Commands
);

public record ProgrammingCommand(
    string CommandType,
    int Parameter1,
    int Parameter2,
    int? FadeTime
);

public record DeployProgrammingResult(
    string DeploymentId,
    bool Success,
    int CommandsSent,
    int CommandsFailed,
    string? ErrorMessage
);