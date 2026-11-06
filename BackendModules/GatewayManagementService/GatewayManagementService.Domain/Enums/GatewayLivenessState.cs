namespace GatewayManagementService.Domain.Enums;

public enum GatewayLivenessState
{
    Unknown = 0,
    Alive = 1,
    Stale = 2,
    Dead = 3
}