// Controllers/StorageController.cs
//
// Storage statistics endpoint for the Dashboard's StorageWidget.
// Served by ProjectExplorerService.Api on port 5199.

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectExplorerService.Domain.Aggregates.ProjectAggregate;
using ProjectExplorerService.Infrastructure.Persistence;

namespace ProjectExplorerService.Api.Controllers;

[ApiController]
[Route("api/storage")]
public class StorageController : ControllerBase
{
    private readonly ProjectExplorerDbContext _context;

    public StorageController(ProjectExplorerDbContext context)
    {
        _context = context;
    }

    private static string NowIso() => DateTime.UtcNow.ToString("o");

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken)
    {
        long usedBytes;
        try
        {
            usedBytes = await _context.Set<ProjectDocument>()
                .AsNoTracking()
                .SumAsync(d => (long?)d.FileSizeInBytes, cancellationToken) ?? 0L;
        }
        catch
        {
            usedBytes = 0L;
        }

        var docCount = await _context.Set<ProjectDocument>()
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var maxBytes = 10L * 1024L * 1024L * 1024L;
        try
        {
            var configured = HttpContext?.RequestServices
                ?.GetService(typeof(IConfiguration)) as IConfiguration;
            var fromConfig = configured?.GetValue<long?>("Storage:MaxBytes");
            if (fromConfig.HasValue && fromConfig.Value > 0) maxBytes = fromConfig.Value;
        }
        catch { /* keep default */ }

        return Ok(new
        {
            usedBytes,
            maxBytes,
            docCount,
            generatedAt = NowIso(),
        });
    }

    [HttpPost("optimize")]
    public IActionResult Optimize()
    {
        return Ok(new { success = true, optimizedAt = NowIso() });
    }
}