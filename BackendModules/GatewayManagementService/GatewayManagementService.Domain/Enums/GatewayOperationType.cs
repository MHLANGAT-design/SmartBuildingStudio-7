namespace GatewayManagementService.Domain.Enums;

public enum GatewayOperationType
{
    Register = 0,
    Update = 1,
    Configure = 2,
    Connect = 3,
    Disconnect = 4,
    Reconnect = 5,
    ExecuteOperation = 6,
    RunDiagnostics = 7
}