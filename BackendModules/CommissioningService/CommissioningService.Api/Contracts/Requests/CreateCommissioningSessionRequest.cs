using System;

namespace CommissioningService.Api.Contracts.Requests;

public class CreateCommissioningSessionRequest
{
    public Guid ProjectId { get; set; }
    public Guid FloorplanId { get; set; }
    public string StartedBy { get; set; } = "System";
}