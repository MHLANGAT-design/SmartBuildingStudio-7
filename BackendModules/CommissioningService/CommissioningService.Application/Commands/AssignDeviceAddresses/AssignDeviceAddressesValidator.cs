using FluentValidation;

namespace CommissioningService.Application.Commands.AssignDeviceAddresses;

public class AssignDeviceAddressesValidator : AbstractValidator<AssignDeviceAddressesCommand>
{
    public AssignDeviceAddressesValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.DeviceExternalId).NotEmpty();
        RuleFor(x => x.Address).InclusiveBetween(0, 63).WithMessage("DALI address must be between 0 and 63.");
    }
}