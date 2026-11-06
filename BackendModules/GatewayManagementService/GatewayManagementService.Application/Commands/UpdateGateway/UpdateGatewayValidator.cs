// GatewayManagementService.Application/Commands/UpdateGateway/UpdateGatewayValidator.cs

using FluentValidation;

namespace GatewayManagementService.Application.Commands.UpdateGateway;

public sealed class UpdateGatewayValidator : AbstractValidator<UpdateGatewayCommand>
{
    public UpdateGatewayValidator()
    {
        RuleFor(x => x.GatewayId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.EndpointHost).NotEmpty().MaximumLength(256);
        RuleFor(x => x.EndpointPort).InclusiveBetween(1, 65535);
    }
}