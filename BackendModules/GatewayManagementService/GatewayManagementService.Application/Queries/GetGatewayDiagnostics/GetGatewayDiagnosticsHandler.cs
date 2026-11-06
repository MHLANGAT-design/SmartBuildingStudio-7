// GatewayManagementService.Application/Queries/GetGatewayDiagnostics/GetGatewayDiagnosticsHandler.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Interfaces;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGatewayDiagnostics;

public sealed class GetGatewayDiagnosticsHandler : IRequestHandler<GetGatewayDiagnosticsQuery, GatewayDiagnosticsDto>
{
    private readonly IGatewayDiagnosticsProvider _diagnostics;

    public GetGatewayDiagnosticsHandler(IGatewayDiagnosticsProvider diagnostics)
    {
        _diagnostics = diagnostics;
    }

    public Task<GatewayDiagnosticsDto> Handle(GetGatewayDiagnosticsQuery request, CancellationToken cancellationToken)
    {
        return _diagnostics.RunAsync(request.GatewayId, cancellationToken);
    }
}