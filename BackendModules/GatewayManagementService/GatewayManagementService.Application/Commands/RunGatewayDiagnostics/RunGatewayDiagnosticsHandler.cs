// GatewayManagementService.Application/Commands/RunGatewayDiagnostics/RunGatewayDiagnosticsHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Interfaces;
using MediatR;

namespace GatewayManagementService.Application.Commands.RunGatewayDiagnostics;

public sealed class RunGatewayDiagnosticsHandler : IRequestHandler<RunGatewayDiagnosticsCommand, GatewayDiagnosticsDto>
{
    private readonly IGatewayDiagnosticsProvider _diagnostics;

    public RunGatewayDiagnosticsHandler(IGatewayDiagnosticsProvider diagnostics)
    {
        _diagnostics = diagnostics;
    }

    public Task<GatewayDiagnosticsDto> Handle(RunGatewayDiagnosticsCommand request, CancellationToken cancellationToken)
    {
        return _diagnostics.RunAsync(request.GatewayId, cancellationToken);
    }
}