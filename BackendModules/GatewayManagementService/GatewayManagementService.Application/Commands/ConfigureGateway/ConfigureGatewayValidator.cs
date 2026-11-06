// GatewayManagementService.Application/Commands/ConfigureGateway/ConfigureGatewayValidator.cs

using FluentValidation;

namespace GatewayManagementService.Application.Commands.ConfigureGateway;

public sealed class ConfigureGatewayValidator : AbstractValidator<ConfigureGatewayCommand>
{
    public ConfigureGatewayValidator()
    {
        RuleFor(x => x.GatewayId).NotEmpty();
        RuleFor(x => x.DaliLineCount).InclusiveBetween(1, 64);
        RuleFor(x => x.PollingIntervalSeconds).GreaterThan(0);
        RuleFor(x => x.CommandTimeoutSeconds).GreaterThan(0);
    }
}