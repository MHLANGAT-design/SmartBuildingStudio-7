using System;
using System.Collections.Generic;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Commands.VerifyProgramming;

public record VerifyProgrammingCommand(
    Guid SessionId,
    string DeploymentId,
    List<VerificationDeviceDto> ExpectedDevices
) : IRequest<VerificationReportDto>;

public record VerificationDeviceDto(
    string DeviceId,
    int HardwareAddress,
    int DeviceType,
    List<int> Groups,
    List<SceneLevelDto> Scenes
);

public record SceneLevelDto(int SceneId, int Level);