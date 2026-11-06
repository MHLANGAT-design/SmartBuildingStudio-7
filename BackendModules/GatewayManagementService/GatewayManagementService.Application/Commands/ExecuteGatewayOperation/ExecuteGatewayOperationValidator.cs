// GatewayManagementService.Application/Commands/ExecuteGatewayOperation/ExecuteGatewayOperationValidator.cs

using FluentValidation;

namespace GatewayManagementService.Application.Commands.ExecuteGatewayOperation;

public sealed class ExecuteGatewayOperationValidator : AbstractValidator<ExecuteGatewayOperationCommand>
{
    public ExecuteGatewayOperationValidator()
    {
        RuleFor(x => x.GatewayId).NotEmpty();
        RuleFor(x => x.OperationType).NotEmpty();
    }
}