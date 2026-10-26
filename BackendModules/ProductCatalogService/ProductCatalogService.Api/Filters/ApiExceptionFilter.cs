using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ProductCatalogService.Application.Common.Exceptions;

namespace ProductCatalogService.Api.Filters;

public class ApiExceptionFilter : IExceptionFilter
{
    private readonly ILogger<ApiExceptionFilter> _logger;

    public ApiExceptionFilter(ILogger<ApiExceptionFilter> logger)
    {
        _logger = logger;
    }

    public void OnException(ExceptionContext context)
    {
        _logger.LogError(context.Exception, "Unhandled exception for {Path}", context.HttpContext.Request.Path);

        var (status, title) = context.Exception switch
        {
            NotFoundException   => (StatusCodes.Status404NotFound, "Resource not found"),
            ValidationException => (StatusCodes.Status400BadRequest, "Validation failed"),
            ConflictException   => (StatusCodes.Status409Conflict, "Conflict"),
            ForbiddenException  => (StatusCodes.Status403Forbidden, "Forbidden"),
            _                   => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
        };

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = context.Exception.Message,
            Instance = context.HttpContext.Request.Path
        };

        if (context.Exception is ValidationException ve)
        {
            problem.Extensions["errors"] = ve.Errors;
        }

        context.Result = new ObjectResult(problem) { StatusCode = status };
        context.ExceptionHandled = true;
    }
}