using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using CommissioningService.Domain.Exceptions;

namespace CommissioningService.Api.Middleware;

public class CommissioningExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CommissioningExceptionMiddleware> _logger;

    public CommissioningExceptionMiddleware(RequestDelegate next, ILogger<CommissioningExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred during a Commissioning API request.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var code = HttpStatusCode.InternalServerError; // 500 if unexpected
        var message = "An internal server error occurred.";

        switch (exception)
        {
            case CommissioningSessionNotFoundException notFoundEx:
                code = HttpStatusCode.NotFound;
                message = notFoundEx.Message;
                break;
            case CommissioningDeviceNotFoundException deviceNotFoundEx:
                code = HttpStatusCode.NotFound;
                message = deviceNotFoundEx.Message;
                break;
            case CommissioningSessionInvalidStateException invalidStateEx:
                code = HttpStatusCode.BadRequest;
                message = invalidStateEx.Message;
                break;
            case CommissioningConflictException conflictEx:
                code = HttpStatusCode.Conflict;
                message = conflictEx.Message;
                break;
            case ArgumentException argEx:
                code = HttpStatusCode.BadRequest;
                message = argEx.Message;
                break;
        }

        var result = JsonSerializer.Serialize(new 
        { 
            error = message,
            traceId = context.TraceIdentifier 
        });
        
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)code;
        return context.Response.WriteAsync(result);
    }
}