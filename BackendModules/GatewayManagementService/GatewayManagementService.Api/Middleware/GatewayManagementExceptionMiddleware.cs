// GatewayManagementService.Api/Middleware/GatewayManagementExceptionMiddleware.cs

using System.Net;
using System.Text.Json;
using FluentValidation;
using GatewayManagementService.Application.Exceptions;
using GatewayManagementService.Domain.Exceptions;

namespace GatewayManagementService.Api.Middleware;

public sealed class GatewayManagementExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GatewayManagementExceptionMiddleware> _logger;

    public GatewayManagementExceptionMiddleware(
        RequestDelegate next,
        ILogger<GatewayManagementExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception while processing {Path}", context.Request.Path);
            await HandleAsync(context, ex);
        }
    }

    private static async Task HandleAsync(HttpContext context, Exception ex)
    {
        var (status, code, message) = ex switch
        {
            ValidationException ve => ((int)HttpStatusCode.BadRequest, "validation_failed", string.Join("; ", ve.Errors.Select(e => e.ErrorMessage))),
            GatewayNotFoundException nf => ((int)HttpStatusCode.NotFound, "not_found", nf.Message),
            GatewayInvalidStateException ise => ((int)HttpStatusCode.Conflict, "invalid_state", ise.Message),
            GatewayConfigurationException ce => ((int)HttpStatusCode.BadRequest, "configuration_error", ce.Message),
            GatewayConnectionException con => ((int)HttpStatusCode.BadGateway, "connection_error", con.Message),
            GatewayOperationException oe => ((int)HttpStatusCode.BadRequest, "operation_failed", oe.Message),
            GatewayApplicationException ae => ((int)HttpStatusCode.BadRequest, "application_error", ae.Message),
            _ => ((int)HttpStatusCode.InternalServerError, "internal_error", "An unexpected error occurred.")
        };

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";

        var body = JsonSerializer.Serialize(new
        {
            code,
            message,
            traceId = context.TraceIdentifier
        });

        await context.Response.WriteAsync(body);
    }
}