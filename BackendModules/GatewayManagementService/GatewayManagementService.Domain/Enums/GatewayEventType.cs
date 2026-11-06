namespace GatewayManagementService.Domain.Enums;

public enum GatewayEventType
{
    Registered = 0,
    Connected = 1,
    Disconnected = 2,
    Reconnected = 3,
    ConfigurationChanged = 4,
    OperationExecuted = 5,
    DiagnosticsCompleted = 6,
    Error = 7
}