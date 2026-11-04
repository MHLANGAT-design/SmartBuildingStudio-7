using CommissioningService.Api.Authorization;
using CommissioningService.Api.Configuration;
using CommissioningService.Api.Health;
using CommissioningService.Api.Middleware;
using CommissioningService.Application.DependencyInjection;
using CommissioningService.Infrastructure.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuration & Layers
builder.Services.AddApplicationLayer();
builder.Services.AddInfrastructureLayer(builder.Configuration);
builder.Services.AddCommissioningApiConfiguration();

// 2. Authorization
builder.Services.AddAuthorization(options =>
{
    CommissioningAuthorizationPolicies.RegisterPolicies(options);
});

// 3. Health Checks
builder.Services.AddHealthChecks()
    .AddCheck<CommissioningHealthCheck>("commissioning_service");

// 4. CORS (Allow the Vite React Frontend)
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// 5. Pipeline (Order is critical)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");

// Custom Middleware
app.UseMiddleware<CommissioningExceptionMiddleware>();
app.UseMiddleware<CommissioningCorrelationMiddleware>();

app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();