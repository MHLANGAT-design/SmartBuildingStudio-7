using System.Collections.Generic;

namespace CommissioningService.Api.Contracts.Requests;

public class VerifyProgrammingRequest
{
    public string DeploymentId { get; set; } = string.Empty;
    public List<VerifyDeviceDto> ExpectedDevices { get; set; } = new();
}

public class VerifyDeviceDto
{
    public string DeviceId { get; set; } = string.Empty;
    public int HardwareAddress { get; set; }
    public int DeviceType { get; set; }
    public List<int> Groups { get; set; } = new();
    public List<VerifySceneLevelDto> Scenes { get; set; } = new();
}

public class VerifySceneLevelDto
{
    public int SceneId { get; set; }
    public int Level { get; set; }
}