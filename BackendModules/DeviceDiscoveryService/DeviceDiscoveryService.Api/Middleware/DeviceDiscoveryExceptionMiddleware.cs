// Middleware/DeviceDiscoveryExceptionMiddleware.cs

using System.Net;
using System.Text.Json;
using DeviceDiscoveryService.Application.Exceptions;
using DeviceDiscoveryService.Domain.Exceptions;
using FluentValidation;

namespace DeviceDiscoveryService.Api.Middleware;

public sealed class DeviceDiscoveryExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DeviceDiscoveryExceptionMiddleware> _logger;

    public DeviceDiscoveryExceptionMiddleware(
        RequestDelegate next,
        ILogger<DeviceDiscoveryExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var traceId = context.TraceIdentifier;

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "An unhandled exception occurred during a DeviceDiscovery API request. TraceId={TraceId}",
                traceId);

            var (status, message) = MapException(ex);

            context.Response.StatusCode = (int)status;
            context.Response.ContentType = "application/json";

            var body = JsonSerializer.Serialize(new
            {
                error = message,
                traceId,
            });

            await context.Response.WriteAsync(body);
        }
    }

    private static (HttpStatusCode Status, string Message) MapException(Exception ex) => ex switch
    {
        // ── Domain exceptions ────────────────────────────────────────
        DiscoverySessionNotFoundException nf       => (HttpStatusCode.NotFound, nf.Message),
        DiscoveredDeviceNotFoundException nf       => (HttpStatusCode.NotFound, nf.Message),
        DiscoverySessionInvalidStateException inv  => (HttpStatusCode.BadRequest, inv.Message),
        DeviceMatchConflictException conf          => (HttpStatusCode.Conflict, conf.Message),

        // ── Application exceptions ───────────────────────────────────
        ProviderUnavailableException pu            => (HttpStatusCode.ServiceUnavailable, pu.Message),

        // ── FluentValidation ─────────────────────────────────────────
        ValidationException ve                     => (HttpStatusCode.BadRequest,
                                                        string.Join("; ", ve.Errors.Select(e => e.ErrorMessage))),

        // ── Derived arguments first, then the base ──────────────────
        ArgumentNullException arg                  => (HttpStatusCode.BadRequest, arg.Message),
        ArgumentOutOfRangeException arg            => (HttpStatusCode.BadRequest, arg.Message),
        ArgumentException arg                      => (HttpStatusCode.BadRequest, arg.Message),

        // ── Fallback ─────────────────────────────────────────────────
        _                                          => (HttpStatusCode.InternalServerError,
                                                        "An internal server error occurred."),
    };
}