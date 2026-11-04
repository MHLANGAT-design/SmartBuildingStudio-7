using System;

namespace CommissioningService.Api.Contracts.Requests;

public class CompleteCommissioningSessionRequest
{
    public Guid SessionId { get; set; }
}