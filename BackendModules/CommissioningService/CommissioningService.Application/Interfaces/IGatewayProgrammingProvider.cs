using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.Commands.DeployProgramming;

namespace CommissioningService.Application.Interfaces;

public interface IGatewayProgrammingProvider
{
    Task<DeployProgrammingResult> DeployPlanAsync(
        string gatewayId,
        string targetLineId,
        string deploymentId,
        List<ProgrammingSequence> sequences,
        CancellationToken cancellationToken = default);
}