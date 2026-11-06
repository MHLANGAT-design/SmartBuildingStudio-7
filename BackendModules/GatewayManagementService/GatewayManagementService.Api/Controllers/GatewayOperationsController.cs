// GatewayManagementService.Api/Controllers/GatewayOperationsController.cs

using GatewayManagementService.Api.Contracts.Requests;
using GatewayManagementService.Api.Contracts.Responses;
using GatewayManagementService.Application.Commands.ExecuteGatewayOperation;
using GatewayManagementService.Application.Queries.GetGatewayOperations;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GatewayManagementService.Api.Controllers;

[ApiController]
[Route("api/v1/gateways/{id:guid}/operations")]
public sealed class GatewayOperationsController : ControllerBase
{
    private readonly ISender _sender;

    public GatewayOperationsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GatewayOperationResponse>>> List(Guid id, CancellationToken cancellationToken)
    {
        var operations = await _sender.Send(new GetGatewayOperationsQuery(id), cancellationToken);
        return Ok(operations.Select(o => new GatewayOperationResponse
        {
            Id = o.Id,
            GatewayId = o.GatewayId,
            OperationType = o.OperationType,
            Payload = o.Payload,
            Result = o.Result,
            Succeeded = o.Succeeded,
            StartedAt = o.StartedAt,
            CompletedAt = o.CompletedAt,
            ErrorMessage = o.ErrorMessage
        }).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<GatewayOperationResponse>> Execute(
        Guid id,
        [FromBody] ExecuteGatewayOperationRequest request,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(
            new ExecuteGatewayOperationCommand(id, request.OperationType, request.Payload),
            cancellationToken);
        return Ok(new GatewayOperationResponse
        {
            Id = dto.Id,
            GatewayId = dto.GatewayId,
            OperationType = dto.OperationType,
            Payload = dto.Payload,
            Result = dto.Result,
            Succeeded = dto.Succeeded,
            StartedAt = dto.StartedAt,
            CompletedAt = dto.CompletedAt,
            ErrorMessage = dto.ErrorMessage
        });
    }
}