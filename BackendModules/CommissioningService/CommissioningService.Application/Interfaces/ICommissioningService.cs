using System;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Interfaces;

public interface ICommissioningService
{
    Task<CommissioningSessionDto> GetSessionAsync(Guid sessionId, CancellationToken cancellationToken = default);
    Task<CommissioningProgressDto> GetProgressAsync(Guid sessionId, CancellationToken cancellationToken = default);
}