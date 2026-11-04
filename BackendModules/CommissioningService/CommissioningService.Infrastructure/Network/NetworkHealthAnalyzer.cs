using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Network;

public class NetworkHealthAnalyzer
{
    public string AnalyzeHealth(NetworkStateDto state)
    {
        if (state.ErrorCount > 0) return "DEGRADED";
        if (state.OnlineDevices < state.TotalDevices) return "WARNING";
        return "HEALTHY";
    }
}