using System;

namespace CommissioningService.Api.Contracts.Requests;

public class StartCommissioningRequest
{
    public Guid SessionId { get; set; }
}