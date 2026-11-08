// Program.cs

using DeviceDiscoveryService.Api.Configuration;
using DeviceDiscoveryService.Api.HealthChecks;
using DeviceDiscoveryService.Api.Middleware;
using DeviceDiscoveryService.Application;
using DeviceDiscoveryService.Infrastructure.DependencyInjection;
using DeviceDiscoveryService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ── Logging: enable EF Core SQL trace so the failing UPDATE is visible ──
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Information);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.ChangeTracking", LogLevel.Debug);

// ── Configuration sections ─────────────────────────────────────────
builder.Services.Configure<ApiConfiguration>(
    builder.Configuration.GetSection(ApiConfiguration.SectionName));

// ── Application + Infrastructure layers ────────────────────────────
builder.Services.AddApplicationLayer();
builder.Services.AddInfrastructureLayer(builder.Configuration);

// ── API-layer services ─────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpClient();     // for the health checks' IHttpClientFactory

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DeviceDiscoveryService API",
        Version = "v1",
        Description = "Physical DALI device discovery, identification, and matching.",
    });
});

builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database")
    .AddCheck<GatewayManagementHealthCheck>("gateway-management")
    .AddCheck<ProjectExplorerHealthCheck>("project-explorer");

// ── CORS ───────────────────────────────────────────────────────────
var apiConfig = builder.Configuration
    .GetSection(ApiConfiguration.SectionName)
    .Get<ApiConfiguration>()
    ?? new ApiConfiguration();

if (apiConfig.CorsOrigins.Length > 0)
{
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins(apiConfig.CorsOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });
}

// ── Build ──────────────────────────────────────────────────────────
var app = builder.Build();

// ── Auto-migrate on startup (dev convenience) ──────────────────────
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<DeviceDiscoveryDbContext>();
        db.Database.Migrate();
        app.Logger.LogInformation("DeviceDiscoveryDb migrated successfully.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to apply DeviceDiscoveryDb migrations at startup.");
    }
}

// ── Middleware pipeline ───────────────────────────────────────────
app.UseMiddleware<DeviceDiscoveryCorrelationMiddleware>();
app.UseMiddleware<DeviceDiscoveryExceptionMiddleware>();

if (apiConfig.EnableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "DeviceDiscoveryService v1");
        c.RoutePrefix = "swagger";
    });
}

if (apiConfig.CorsOrigins.Length > 0)
{
    app.UseCors();
}

app.MapControllers();
app.MapHealthChecks("/health");

app.Logger.LogInformation(
    "DeviceDiscoveryService API starting on {Urls}",
    string.Join(", ", app.Urls));

app.Run();