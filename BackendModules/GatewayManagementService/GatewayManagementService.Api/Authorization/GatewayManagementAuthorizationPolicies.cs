// GatewayManagementService.Api/Authorization/GatewayManagementAuthorizationPolicies.cs

namespace GatewayManagementService.Api.Authorization;

public static class GatewayManagementAuthorizationPolicies
{
    public const string GatewayRead = "GatewayManagement.Read";
    public const string GatewayWrite = "GatewayManagement.Write";
    public const string GatewayOperate = "GatewayManagement.Operate";
}