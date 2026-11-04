using System;

namespace CommissioningService.Api.Contracts.Responses;

public class CommissioningProgressResponse
{
    public Guid SessionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalDevices { get; set; }
    public int AddressedDevices { get; set; }
    public int TestedDevices { get; set; }
    public int OpenDefects { get; set; }
    public int ProgressPercentage { get; set; }
}