using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.FaultManagement;

public class FaultClassifier
{
    public string ClassifySeverity(TestResultDto result)
    {
        return result.Status == "FAILED" ? "HIGH" : "LOW";
    }
}