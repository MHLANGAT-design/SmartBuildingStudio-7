using System;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Infrastructure.Realtime;

public class CommissioningProgressPublisher : ICommissioningProgressPublisher
{
    public Task PublishProgressAsync(Guid sessionId, CommissioningProgressDto progress, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task PublishStatusChangeAsync(Guid sessionId, string newStatus, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}