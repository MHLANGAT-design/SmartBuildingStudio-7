using Microsoft.EntityFrameworkCore;
using ProjectExplorerService.Domain.RepositoryContracts;
using ProjectExplorerService.Infrastructure.Persistence;
using ProjectExplorerService.Infrastructure.Persistence.Repositories;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Collections.Generic;
using System.IO.Compression;
using System.Linq;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);

// ─── Response compression ─────────────────────────────────────────────
// Compresses JSON responses over the wire. The document endpoints return
// large drawnWallsJson blobs; without this, the client downloads the full
// uncompressed payload (typically 600 KB – 1 MB for real floor plans).
//
// Brotli is preferred where the client advertises support (all modern
// browsers), with gzip as the fallback. Fastest compression level is used
// on purpose: JSON compresses well at any level, and Fastest is roughly
// 5–10× quicker than Optimal, which matters more than shaving a few extra
// percent off the wire size for a local/LAN API.
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "application/problem+json",
    });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

// Add core web framework controllers and utilities
builder.Services.AddControllers(options =>
{
    // Commits any EF-tracked changes after a successful controller action
    // returns. See the class-level doc on AutomaticUnitOfWorkFilter below for
    // the full contract.
    options.Filters.Add<AutomaticUnitOfWorkFilter>();
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 1. DATABASE BINDING: Configured to look up your permanent local SQL Server instance
var connectionString = builder.Configuration.GetConnectionString("ProjectExplorerConnection");
builder.Services.AddDbContext<ProjectExplorerDbContext>(options =>
    options.UseSqlServer(connectionString));

// Bind your domain repository contracts cleanly
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();

// 2. CORS REGISTRATION: Allowance policy matching your Vite UI dev ports
builder.Services.AddCors(options =>
{
    options.AddPolicy("SmartBuildingStudioExplorerDevPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// ─── Response compression (middleware) ────────────────────────────────
// Must be registered before routing/endpoint mapping so it wraps every
// response. Placed here, ahead of CORS, Swagger, and controllers.
app.UseResponseCompression();

// Activate CORS right away before request handling middleware layers check routes
app.UseCors("SmartBuildingStudioExplorerDevPolicy");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();

// =========================================================================
// 🚀 FIXED: PARAMETER-MATCHED DDD SEEDING INITIALIZATION LOOP
// =========================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ProjectExplorerDbContext>();
        context.Database.EnsureCreated();

        if (!context.Projects.Any())
        {
            Console.WriteLine("[SQL Database] Seeding initial read-only DDD aggregates via reflection...");

            var projectId = Guid.NewGuid();
            var buildingId = Guid.NewGuid();
            var floorId = Guid.NewGuid();
            var documentId = Guid.NewGuid();
            var currentTimestamp = DateTime.UtcNow.ToString("o");

            var seededDocument = new ProjectExplorerService.Domain.Aggregates.ProjectAggregate.ProjectDocument(
                documentId, "Architectural Plan", 0, "/viewer/doc-001", 1, "Tif", currentTimestamp, 4194304
            );

            var seededFloor = new ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Floor(
                floorId, buildingId, "Ground Floor", 0, 0.0, 1450.50, currentTimestamp
            );

            var seededBuilding = new ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Building(
                buildingId, projectId, "Building A", "BLDG-A", "100 Innovation Way", currentTimestamp
            );

            var seededProject = new ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Project(
                projectId, "Corporate Headquarters", "Smart LED & DALI Management Workspace Layer", "Apex Development Corp", "PRJ-2026-001", currentTimestamp
            );

            var flags = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public;

            var docsField = typeof(ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Floor)
                .GetFields(flags).FirstOrDefault(f => f.FieldType.IsGenericType && f.FieldType.GetGenericArguments().Contains(typeof(ProjectExplorerService.Domain.Aggregates.ProjectAggregate.ProjectDocument)));

            if (docsField != null && docsField.GetValue(seededFloor) is List<ProjectExplorerService.Domain.Aggregates.ProjectAggregate.ProjectDocument> docList)
                docList.Add(seededDocument);
            else if (seededFloor.Documents is List<ProjectExplorerService.Domain.Aggregates.ProjectAggregate.ProjectDocument> directDocList)
                directDocList.Add(seededDocument);

            var floorsField = typeof(ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Building)
                .GetFields(flags).FirstOrDefault(f => f.FieldType.IsGenericType && f.FieldType.GetGenericArguments().Contains(typeof(ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Floor)));

            if (floorsField != null && floorsField.GetValue(seededBuilding) is List<ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Floor> floorList)
                floorList.Add(seededFloor);
            else if (seededBuilding.Floors is List<ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Floor> directFloorList)
                directFloorList.Add(seededFloor);

            var bldgsField = typeof(ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Project)
                .GetFields(flags).FirstOrDefault(f => f.FieldType.IsGenericType && f.FieldType.GetGenericArguments().Contains(typeof(ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Building)));

            if (bldgsField != null && bldgsField.GetValue(seededProject) is List<ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Building> bldgList)
                bldgList.Add(seededBuilding);
            else if (seededProject.Buildings is List<ProjectExplorerService.Domain.Aggregates.ProjectAggregate.Building> directBldgList)
                directBldgList.Add(seededBuilding);

            context.Projects.Add(seededProject);
            context.SaveChanges();
            Console.WriteLine("[SQL Database] Seeding successful. Immutable domain aggregates safely generated on hard drive.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Database Seeding Failure] Critical exception applying core models: {ex.Message}");
    }
}

app.MapControllers();
app.Run();

// =========================================================================
// AUTOMATIC UNIT OF WORK PERSISTENCE FILTER
// =========================================================================
//
// Commits any EF Core tracked changes after a controller action returns
// successfully. Registered globally in Program.cs above via
// options.Filters.Add<AutomaticUnitOfWorkFilter>().
//
// CONTROLLER CONTRACT:
//   • Add / Update / Remove entities on the injected ProjectExplorerDbContext
//     and return Ok(...). Do NOT call SaveChangesAsync yourself — the filter
//     commits on your behalf after the action returns.
//   • Read-only endpoints are unaffected — a filter pass with no tracked
//     changes is a no-op.
//   • If you write a "dry run", "preview", or "validate" endpoint that
//     mutates the context but must NOT persist, you must either (a) avoid
//     touching the DbContext, or (b) wrap your changes in an explicit
//     transaction and roll it back before returning. The filter does not
//     distinguish "user confirmed" from "we just checked something" and
//     will happily commit staged changes.
//
// If this becomes a problem, consider an opt-out marker attribute
// (e.g. [SkipAutoSave]) checked inside OnActionExecutionAsync, and apply
// it to dry-run actions. Until then, keep this contract in mind whenever
// adding a new mutating action.
// =========================================================================
public class AutomaticUnitOfWorkFilter : IAsyncActionFilter
{
    private readonly ProjectExplorerDbContext _context;

    public AutomaticUnitOfWorkFilter(ProjectExplorerDbContext context)
    {
        _context = context;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executedContext = await next();

        // If the endpoint runs successfully without errors, save tracked nested collection updates automatically
        if (executedContext.Exception == null)
        {
            await _context.SaveChangesAsync();
        }
    }
}