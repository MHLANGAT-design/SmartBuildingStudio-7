using System;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Interfaces;

public interface ICommissioningReportService
{
    Task<CommissioningReportDto> GenerateReportAsync(
        Guid sessionId, 
        CancellationToken cancellationToken = default);
        
    Task<byte[]> ExportReportToPdfAsync(
        Guid sessionId, 
        CancellationToken cancellationToken = default);
}