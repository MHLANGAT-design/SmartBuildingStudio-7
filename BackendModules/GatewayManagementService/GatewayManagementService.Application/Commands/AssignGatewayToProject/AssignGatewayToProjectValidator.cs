// GatewayManagementService.Application/Commands/AssignGatewayToProject/AssignGatewayToProjectValidator.cs

using FluentValidation;

namespace GatewayManagementService.Application.Commands.AssignGatewayToProject;

public sealed class AssignGatewayToProjectValidator : AbstractValidator<AssignGatewayToProjectCommand>
{
    public AssignGatewayToProjectValidator()
    {
        RuleFor(x => x.GatewayId).NotEmpty();
        RuleFor(x => x.ProjectId).NotEmpty();
    }
}