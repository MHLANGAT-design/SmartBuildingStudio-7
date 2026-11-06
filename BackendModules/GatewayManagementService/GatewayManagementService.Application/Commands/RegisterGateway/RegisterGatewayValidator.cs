// GatewayManagementService.Application/Commands/RegisterGateway/RegisterGatewayValidator.cs

using FluentValidation;

namespace GatewayManagementService.Application.Commands.RegisterGateway;

public sealed class RegisterGatewayValidator : AbstractValidator<RegisterGatewayCommand>
{
    public RegisterGatewayValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Identifier).NotEmpty().MaximumLength(128);
        RuleFor(x => x.Transport)
            .NotEmpty()
            .Must(v => v is "Http" or "Tcp" or "WebSocket")
            .WithMessage("Transport must be one of: Http, Tcp, WebSocket.");
        RuleFor(x => x.DaliProtocol)
            .NotEmpty()
            .Must(v => v is "Dali2" or "Dali1Legacy" or "DaliWireless")
            .WithMessage("DaliProtocol must be one of: Dali2, Dali1Legacy, DaliWireless.");
        RuleFor(x => x.EndpointHost).NotEmpty().MaximumLength(256);
        RuleFor(x => x.EndpointPort).InclusiveBetween(1, 65535);
        RuleFor(x => x.DaliLineCount).InclusiveBetween(1, 64);
        RuleFor(x => x.PollingIntervalSeconds).GreaterThan(0);
        RuleFor(x => x.CommandTimeoutSeconds).GreaterThan(0);
    }
}