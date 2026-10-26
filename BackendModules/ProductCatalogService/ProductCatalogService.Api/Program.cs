// BackendModules/ProductCatalogService/ProductCatalogService.Api/Program.cs

using System.Text.Json.Serialization;
using ProductCatalogService.Api.Extensions;
using ProductCatalogService.Api.Filters;
using ProductCatalogService.Api.Middleware;
using ProductCatalogService.Application;
using ProductCatalogService.Application.Abstractions;
using ProductCatalogService.Infrastructure;
using ProductCatalogService.Infrastructure.Storage;

var builder = WebApplication.CreateBuilder(args);

// ─── Controllers + JSON options ─────────────────────────────────────
// camelCase is what the frontend expects. Without this, ProductDto
// and PhotometricDistributionDto serialize as PascalCase and the
// frontend's typed interfaces will silently produce undefined fields.
builder.Services
    .AddControllers(options =>
    {
        options.Filters.Add<ApiExceptionFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerDocumentation();

// ─── Layer composition roots ────────────────────────────────────────
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddCatalogHealthChecks(builder.Configuration);

// ─── File storage (photometric files, datasheets) ───────────────────
// Files are written under {ContentRoot}/App_Data/photometric-files/{productId}/.
// The URL returned by IFileStorage.SaveAsync is served back via
// PhotometricFilesController.Download. Swap for a blob-backed
// implementation by replacing FileSystemFileStorage here — no call
// sites change.
builder.Services.AddSingleton<IFileStorage>(sp =>
{
    var env = sp.GetRequiredService<IWebHostEnvironment>();
    var root = Path.Combine(env.ContentRootPath, "App_Data");
    return new FileSystemFileStorage(root);
});

// ─── CORS ───────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultCorsPolicy", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? Array.Empty<string>();

        if (allowedOrigins.Length == 0)
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

// ─── HTTP pipeline ──────────────────────────────────────────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("DefaultCorsPolicy");

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();