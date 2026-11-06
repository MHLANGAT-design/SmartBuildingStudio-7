// GatewayManagementService.Infrastructure/Operations/OperationResultProcessor.cs

namespace GatewayManagementService.Infrastructure.Operations;

public sealed class OperationResultProcessor
{
    public bool IsSuccess(string result) =>
        !string.IsNullOrEmpty(result) && !result.Contains("\"success\":false", StringComparison.OrdinalIgnoreCase);
}