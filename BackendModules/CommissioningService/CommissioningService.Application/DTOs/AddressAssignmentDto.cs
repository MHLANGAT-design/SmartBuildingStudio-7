using System;

namespace CommissioningService.Application.DTOs;

public class AddressAssignmentDto
{
    public Guid Id { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string LineId { get; set; } = string.Empty;
    public int ShortAddress { get; set; }
    public bool IsVerified { get; set; }
}