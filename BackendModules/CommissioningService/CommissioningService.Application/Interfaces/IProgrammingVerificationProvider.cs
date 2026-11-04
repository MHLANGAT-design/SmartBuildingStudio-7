using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.Commands.VerifyProgramming;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Interfaces;

public interface IProgrammingVerificationProvider
{
    Task<VerificationReportDto> VerifyAsync(
        string deploymentId,
        List<VerificationDeviceDto> expectedDevices,
        CancellationToken cancellationToken = default);
}