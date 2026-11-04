namespace CommissioningService.Domain.Enums;

public enum CommissioningSessionStatus
{
    Idle = 0,
    Discovering = 1,
    Addressing = 2,
    Testing = 3,
    Completed = 4,
    Failed = 5
}