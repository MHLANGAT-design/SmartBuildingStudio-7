using System;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Application.Interfaces;

public interface ICommissioningAuditService
{
    Task LogActionAsync(
        Guid sessionId, 
        string action, 
        string performedBy, 
        string details, 
        CancellationToken cancellationToken = default);
}