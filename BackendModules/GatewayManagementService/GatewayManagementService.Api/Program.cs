// GatewayManagementService.Api/Program.cs

using GatewayManagementService.Api.Configuration;
using GatewayManagementService.Api.Health;
using GatewayManagementService.Api.Middleware;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddGatewayManagementServices(builder.Configuration);

builder.Services.AddHealthChecks()
    .AddCheck<GatewayManagementHealthCheck>("gateway-management-db");

var corsOrigin = builder.Configuration["GatewayManagement:CorsOrigin"];
if (!string.IsNullOrEmpty(corsOrigin))
{
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
            policy.WithOrigins(corsOrigin).AllowAnyHeader().AllowAnyMethod());
    });
}

var app = builder.Build();

app.UseMiddleware<GatewayManagementCorrelationMiddleware>();
app.UseMiddleware<GatewayManagementExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!string.IsNullOrEmpty(corsOrigin))
{
    app.UseCors();
}

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

public partial class Program { }