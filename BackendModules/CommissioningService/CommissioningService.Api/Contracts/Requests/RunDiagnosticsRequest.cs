namespace CommissioningService.Api.Contracts.Requests;

public class RunDiagnosticsRequest
{
    public string GatewayId { get; set; } = string.Empty;
    public string LineId { get; set; } = string.Empty;
}