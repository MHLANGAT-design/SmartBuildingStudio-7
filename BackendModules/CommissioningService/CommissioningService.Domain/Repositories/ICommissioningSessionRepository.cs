using System;
using System.Threading.Tasks;
using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Repositories;

public interface ICommissioningSessionRepository
{
    Task<CommissioningSession?> GetByIdAsync(CommissioningSessionId id);
    Task AddAsync(CommissioningSession session);
    Task UpdateAsync(CommissioningSession session);
}