using System;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Interfaces;

public interface ICommissioningProgressPublisher
{
    Task PublishProgressAsync(
        Guid sessionId, 
        CommissioningProgressDto progress, 
        CancellationToken cancellationToken = default);
        
    Task PublishStatusChangeAsync(
        Guid sessionId, 
        string newStatus, 
        CancellationToken cancellationToken = default);
}