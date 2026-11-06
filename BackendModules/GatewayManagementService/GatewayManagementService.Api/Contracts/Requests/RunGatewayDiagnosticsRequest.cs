// GatewayManagementService.Api/Contracts/Requests/RunGatewayDiagnosticsRequest.cs

namespace GatewayManagementService.Api.Contracts.Requests;

public sealed record RunGatewayDiagnosticsRequest(
    bool IncludeFullChecks = true);