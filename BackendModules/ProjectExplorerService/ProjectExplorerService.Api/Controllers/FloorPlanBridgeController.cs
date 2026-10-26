// FloorPlanBridgeController.cs
//
// Update-only bridge for FloorPlanDesigner + DALI Designer.
// Document creation lives in ProjectExplorerController.AddDocument.
//
// Vite rewrites /api/v1/project-explorer/* → /api/projectexplorer/*
//
// Lock semantics (Level 1):
//   • GET documents/{id} → returns isLocked + lockedByUsername
//   • PUT documents/{id} → 423 if locked by another user
//   • POST documents/{id}/lock   → sets lock to CurrentUser
//   • POST documents/{id}/unlock → 403 if locked by another user
//
// Breadcrumb: GET documents/{id} now returns projectName / buildingName /
// floorName alongside the document name, so the FPD breadcrumb widget
// displays the real hierarchy instead of "Unknown Project".

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectExplorerService.Domain.Aggregates.ProjectAggregate;
using ProjectExplorerService.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace ProjectExplorerService.Api.Controllers;

[ApiController]
[Route("api/projectexplorer")]
public class FloorPlanBridgeController : ControllerBase
{
    private readonly ProjectExplorerDbContext _context;

    // TODO: replace with real auth when available.
    private const string CurrentUser = "Studio System";

    public FloorPlanBridgeController(ProjectExplorerDbContext context)
    {
        _context = context;
    }

    // ================================================================
    // FLOOR PLAN GEOMETRY
    // ================================================================

    [HttpGet("documents/{id:guid}")]
    public async Task<IActionResult> GetDocumentById(Guid id, CancellationToken cancellationToken)
    {
        var dbConn = _context.Database.GetDbConnection();

        if (dbConn.State != ConnectionState.Open)
        {
            await dbConn.OpenAsync(cancellationToken);
        }

        await using var cmd = dbConn.CreateCommand();
        cmd.CommandText = @"
            SELECT [Id], [Name], [Version], [LastModifiedBy], [LastModifiedTimestamp],
                   [DrawnWallsJson], [DefinedRoomsJson], [PlacedFixturesJson],
                   [PixelsToMetresScale], [IsLocked], [LockedByUsername]
            FROM [ProjectDocuments]
            WHERE [Id] = @id";

        var idParam = cmd.CreateParameter();
        idParam.ParameterName = "@id";
        idParam.DbType = DbType.Guid;
        idParam.Value = id;
        cmd.Parameters.Add(idParam);

        await using var reader = await cmd.ExecuteReaderAsync(
            CommandBehavior.SequentialAccess | CommandBehavior.SingleRow,
            cancellationToken
        );

        if (!await reader.ReadAsync(cancellationToken))
        {
            return NotFound(new { message = $"Document with ID '{id}' was not found in the project explorer database." });
        }

        var docId              = reader.GetGuid(0);
        var name               = reader.GetString(1);
        var version            = reader.GetInt32(2);
        var lastModifiedBy     = reader.IsDBNull(3) ? null : reader.GetString(3);
        var lastModifiedTs     = reader.IsDBNull(4) ? null : reader.GetString(4);
        var drawnWallsJson     = reader.IsDBNull(5) ? "" : reader.GetString(5);
        var definedRoomsJson   = reader.IsDBNull(6) ? "" : reader.GetString(6);
        var placedFixturesJson = reader.IsDBNull(7) ? "" : reader.GetString(7);
        var pixelsToMetres     = reader.GetDouble(8);
        var isLocked           = reader.GetBoolean(9);
        var lockedByUsername   = reader.IsDBNull(10) ? null : reader.GetString(10);

        // ── Breadcrumb lookup via EF Core ─────────────────────────────
        // Join ProjectDocument → Floor → Building → Project to retrieve
        // the parent names. If the chain is broken (orphaned doc), the
        // values fall back to "Unknown ...".
        string? projectIdStr = null;
        string? buildingIdStr = null;
        string? floorIdStr = null;
        string projectName = "Unknown Project";
        string buildingName = "Unknown Building";
        string floorName = "Unknown Floor";

        try
        {
            var breadcrumb = await _context.Set<ProjectDocument>()
                .AsNoTracking()
                .Where(d => d.Id == id)
                .Join(_context.Set<Floor>(),
                    d => EF.Property<Guid>(d, "FloorId"),
                    f => f.Id,
                    (d, f) => new { Floor = f })
                .Join(_context.Set<Building>(),
                    x => x.Floor.BuildingId,
                    b => b.Id,
                    (x, b) => new { x.Floor, Building = b })
                .Join(_context.Set<Project>(),
                    x => x.Building.ProjectId,
                    p => p.Id,
                    (x, p) => new {
                        FloorId = x.Floor.Id,
                        FloorName = x.Floor.Name,
                        BuildingId = x.Building.Id,
                        BuildingName = x.Building.Name,
                        ProjectId = p.Id,
                        ProjectName = p.Name,
                    })
                .FirstOrDefaultAsync(cancellationToken);

            if (breadcrumb != null)
            {
                projectIdStr = breadcrumb.ProjectId.ToString();
                buildingIdStr = breadcrumb.BuildingId.ToString();
                floorIdStr = breadcrumb.FloorId.ToString();
                projectName = breadcrumb.ProjectName ?? projectName;
                buildingName = breadcrumb.BuildingName ?? buildingName;
                floorName = breadcrumb.FloorName ?? floorName;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Bridge] Breadcrumb lookup failed for doc {id}: {ex.Message}");
            // Continue with "Unknown ..." fallbacks
        }

        var response = new
        {
            documentId = docId.ToString(),
            id = docId.ToString(),
            name,
            activeDocumentName = name,
            description = "Floor Plan Blueprint Asset Layout",
            status = "Draft",
            version,
            createdAt = lastModifiedTs,
            updatedAt = lastModifiedTs,
            lastModifiedBy,
            dimensions = new
            {
                width = 120.0,
                height = 80.0,
                unit = "m",
                gridSpacing = 1.0
            },
            drawnWallsJson,
            definedRoomsJson,
            placedFixturesJson,
            pixelsToMetresScale = pixelsToMetres,
            isLocked,
            lockedByUsername,
            // ── Breadcrumb fields (new) ───────────────────────────────
            projectId = projectIdStr,
            projectName,
            buildingId = buildingIdStr,
            buildingName,
            floorId = floorIdStr,
            floorName,
        };

        return Ok(response);
    }

    [HttpPut("documents/{id:guid}")]
    public async Task<IActionResult> SaveDocumentCanvasLayout(
        Guid id,
        [FromBody] UpdateDocumentCanvasLayoutDto payload,
        CancellationToken cancellationToken)
    {
        if (payload == null)
        {
            return BadRequest(new { message = "The comprehensive blueprint payload contract cannot be empty." });
        }

        var doc = await _context.Set<ProjectDocument>()
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (doc == null)
        {
            return NotFound(new { message = $"Document entity row matching ID '{id}' was missing from the repository." });
        }

        // ── LEVEL 1 ENFORCEMENT ──────────────────────────────────────
        if (doc.IsLocked && doc.LockedByUsername != CurrentUser)
        {
            return StatusCode(423, new
            {
                message = $"Document is locked by {doc.LockedByUsername}. Cannot save.",
                lockedBy = doc.LockedByUsername,
            });
        }

        try
        {
            doc.UpdateFloorPlanData(
                payload.DrawnWallsJson,
                payload.DefinedRoomsJson,
                payload.PlacedFixturesJson,
                payload.PixelsToMetresScale,
                CurrentUser,
                DateTime.UtcNow.ToString("o"),
                null
            );

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                documentId = doc.Id.ToString(),
                id = doc.Id.ToString(),
                name = doc.Name,
                version = doc.Version,
                lastModified = doc.LastModifiedTimestamp,
                lastModifiedBy = doc.LastModifiedBy,
                drawnWallsJson = doc.DrawnWallsJson,
                definedRoomsJson = doc.DefinedRoomsJson,
                placedFixturesJson = doc.PlacedFixturesJson,
                pixelsToMetresScale = doc.PixelsToMetresScale,
                message = "Document saved successfully"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Bridge Persistence Exception]: Save failed for GUID {id}. Trace: {ex.Message}");
            return StatusCode(500, new { error = "Internal error during save: " + ex.Message });
        }
    }

    [HttpPost("documents/{id:guid}/lock")]
    public async Task<IActionResult> LockDocument(Guid id)
    {
        var doc = await _context.Set<ProjectDocument>().FirstOrDefaultAsync(d => d.Id == id);
        if (doc == null)
        {
            return NotFound(new { message = $"Document with ID '{id}' was not found." });
        }

        if (doc.IsLocked && doc.LockedByUsername != CurrentUser)
        {
            return StatusCode(423, new
            {
                message = $"Document is already locked by {doc.LockedByUsername}.",
                lockedBy = doc.LockedByUsername,
            });
        }

        doc.Lock(CurrentUser, DateTime.UtcNow.ToString("o"));
        await _context.SaveChangesAsync();

        return Ok(new { success = true, locked = true, lockedBy = CurrentUser });
    }

    [HttpPost("documents/{id:guid}/unlock")]
    public async Task<IActionResult> UnlockDocument(Guid id)
    {
        var doc = await _context.Set<ProjectDocument>().FirstOrDefaultAsync(d => d.Id == id);
        if (doc == null)
        {
            return NotFound(new { message = $"Document with ID '{id}' was not found." });
        }

        if (doc.IsLocked && doc.LockedByUsername != CurrentUser)
        {
            return StatusCode(403, new
            {
                message = $"Document is locked by {doc.LockedByUsername}. Cannot unlock.",
                lockedBy = doc.LockedByUsername,
            });
        }

        doc.Unlock(CurrentUser, DateTime.UtcNow.ToString("o"));
        await _context.SaveChangesAsync();

        return Ok(new { success = true, locked = false });
    }

    // ================================================================
    // DALI ── FIXTURES
    // ================================================================

    [HttpGet("projects/{projectId:guid}/floorplans/{floorplanId:guid}/fixtures")]
    public async Task<IActionResult> GetPlacedFixtures(
        Guid projectId,
        Guid floorplanId,
        CancellationToken cancellationToken)
    {
        var doc = await _context.Set<ProjectDocument>()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == floorplanId, cancellationToken);

        if (doc == null)
        {
            return NotFound(new { message = $"Floorplan document '{floorplanId}' not found." });
        }

        var fixtures = new List<PlacedFixtureDto>();

        if (!string.IsNullOrWhiteSpace(doc.PlacedFixturesJson))
        {
            try
            {
                using var placedDoc = JsonDocument.Parse(doc.PlacedFixturesJson);
                if (placedDoc.RootElement.TryGetProperty("electricalFixtures", out var fx) &&
                    fx.ValueKind == JsonValueKind.Array)
                {
                    foreach (var f in fx.EnumerateArray())
                    {
                        fixtures.Add(new PlacedFixtureDto(
                            Id:        GetString(f, "id") ?? string.Empty,
                            X:         GetDouble(f, "x"),
                            Y:         GetDouble(f, "y"),
                            Kind:      GetString(f, "kind") ?? GetString(f, "type") ?? "luminaire",
                            ProductId: GetString(f, "productId"),
                            Rotation:  GetDouble(f, "rotation"),
                            RoomId:    GetString(f, "roomId"),
                            Elevation: GetNullableDouble(f, "elevation"),
                            LayerId:   GetString(f, "layerId"),
                            DaliGroup: (int)GetDouble(f, "daliGroup", 1)
                        ));
                    }
                }
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"[DALI Bridge] PlacedFixturesJson parse failed for doc {floorplanId}: {ex.Message}");
                return StatusCode(500, new { error = "PlacedFixturesJson is not valid JSON." });
            }
        }

        return Ok(fixtures);
    }

    // ================================================================
    // DALI ── NETWORKS
    // ================================================================

    [HttpGet("projects/{projectId:guid}/floorplans/{floorplanId:guid}/dali-networks")]
    public async Task<IActionResult> ListDaliNetworksForFloorplan(
        Guid projectId,
        Guid floorplanId,
        CancellationToken cancellationToken)
    {
        var doc = await _context.Set<ProjectDocument>()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == floorplanId, cancellationToken);

        if (doc == null)
        {
            return NotFound(new { message = $"Floorplan document '{floorplanId}' not found." });
        }

        var networks = await _context.DaliNetworks
            .AsNoTracking()
            .Where(n => n.DocumentId == floorplanId)
            .OrderByDescending(n => n.UpdatedAt)
            .Select(n => new
            {
                id = n.Id.ToString(),
                name = n.Name,
                revision = n.Revision,
                updatedAt = n.UpdatedAt,
            })
            .ToListAsync(cancellationToken);

        return Ok(networks);
    }

    [HttpPost("projects/{projectId:guid}/dali-networks")]
    public async Task<IActionResult> CreateDaliNetwork(
        Guid projectId,
        [FromBody] SaveDaliNetworkDto payload,
        CancellationToken cancellationToken)
    {
        if (payload == null || payload.Payload.ValueKind == JsonValueKind.Undefined)
        {
            return BadRequest(new { message = "Payload is required." });
        }

        if (!Guid.TryParse(payload.FloorplanId, out var floorplanId))
        {
            return BadRequest(new { message = "FloorplanId must be a valid GUID." });
        }

        var doc = await _context.Set<ProjectDocument>()
            .FirstOrDefaultAsync(d => d.Id == floorplanId, cancellationToken);

        if (doc == null)
        {
            return NotFound(new { message = $"Floorplan document '{floorplanId}' not found." });
        }

        Guid newId = Guid.NewGuid();
        if (!string.IsNullOrWhiteSpace(payload.Id) &&
            Guid.TryParse(payload.Id, out var parsedId))
        {
            newId = parsedId;
        }

        var existing = await _context.DaliNetworks
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == newId, cancellationToken);

        if (existing != null)
        {
            return Ok(BuildNetworkResponse(existing, projectId, floorplanId));
        }

        var now = DateTime.UtcNow.ToString("o");
        var entity = new DaliNetwork(
            id: newId,
            documentId: floorplanId,
            name: payload.Name ?? "New DALI Network",
            payloadJson: payload.Payload.GetRawText(),
            createdAt: now
        );

        _context.DaliNetworks.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(BuildNetworkResponse(entity, projectId, floorplanId));
    }

    [HttpGet("projects/{projectId:guid}/dali-networks/{networkId:guid}")]
    public async Task<IActionResult> GetDaliNetwork(
        Guid projectId,
        Guid networkId,
        CancellationToken cancellationToken)
    {
        var network = await _context.DaliNetworks
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == networkId, cancellationToken);

        if (network == null)
        {
            return NotFound(new { message = $"DALI network '{networkId}' not found in project '{projectId}'." });
        }

        return Ok(BuildNetworkResponse(network, projectId, network.DocumentId));
    }

    [HttpPut("projects/{projectId:guid}/dali-networks/{networkId:guid}")]
    public async Task<IActionResult> UpdateDaliNetwork(
        Guid projectId,
        Guid networkId,
        [FromBody] SaveDaliNetworkDto payload,
        CancellationToken cancellationToken)
    {
        if (payload == null || payload.Payload.ValueKind == JsonValueKind.Undefined)
        {
            return BadRequest(new { message = "Payload is required." });
        }

        var network = await _context.DaliNetworks
            .FirstOrDefaultAsync(n => n.Id == networkId, cancellationToken);

        if (network == null)
        {
            return NotFound(new { message = $"DALI network '{networkId}' not found in project '{projectId}'." });
        }

        network.UpdatePayload(
            name: payload.Name,
            payloadJson: payload.Payload.GetRawText(),
            updatedAt: DateTime.UtcNow.ToString("o")
        );

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(BuildNetworkResponse(network, projectId, network.DocumentId));
    }

    [HttpDelete("projects/{projectId:guid}/dali-networks/{networkId:guid}")]
    public async Task<IActionResult> DeleteDaliNetwork(
        Guid projectId,
        Guid networkId,
        CancellationToken cancellationToken)
    {
        var network = await _context.DaliNetworks
            .FirstOrDefaultAsync(n => n.Id == networkId, cancellationToken);

        if (network == null)
        {
            return NoContent();
        }

        _context.DaliNetworks.Remove(network);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    // ================================================================
    // helpers
    // ================================================================

    private static object BuildNetworkResponse(
        DaliNetwork network,
        Guid projectId,
        Guid floorplanId)
    {
        var merged = new Dictionary<string, object?>
        {
            ["id"] = network.Id.ToString(),
            ["projectId"] = projectId.ToString(),
            ["floorplanId"] = floorplanId.ToString(),
            ["name"] = network.Name,
            ["revision"] = network.Revision,
            ["updatedAt"] = network.UpdatedAt,
        };

        if (!string.IsNullOrWhiteSpace(network.PayloadJson))
        {
            try
            {
                using var parsed = JsonDocument.Parse(network.PayloadJson);
                foreach (var prop in parsed.RootElement.EnumerateObject())
                {
                    if (!merged.ContainsKey(prop.Name))
                    {
                        merged[prop.Name] = prop.Value.Clone();
                    }
                }
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"[DALI Bridge] PayloadJson parse failed for network {network.Id}: {ex.Message}");
            }
        }

        return merged;
    }

    private static string? GetString(JsonElement el, string name)
    {
        if (!el.TryGetProperty(name, out var v)) return null;
        return v.ValueKind switch
        {
            JsonValueKind.String => v.GetString(),
            JsonValueKind.Number => v.GetRawText(),
            JsonValueKind.True or JsonValueKind.False => v.GetBoolean().ToString(),
            _ => null
        };
    }

    private static double GetDouble(JsonElement el, string name, double fallback = 0)
    {
        if (!el.TryGetProperty(name, out var v)) return fallback;
        return v.ValueKind == JsonValueKind.Number ? v.GetDouble() : fallback;
    }

    private static double? GetNullableDouble(JsonElement el, string name)
    {
        if (!el.TryGetProperty(name, out var v)) return null;
        return v.ValueKind == JsonValueKind.Number ? v.GetDouble() : null;
    }
}

// ================================================================
// DTOs
// ================================================================

public record UpdateDocumentCanvasLayoutDto(
    string DrawnWallsJson,
    string DefinedRoomsJson,
    string PlacedFixturesJson,
    double PixelsToMetresScale
);

public record PlacedFixtureDto(
    string Id,
    double X,
    double Y,
    string Kind,
    string? ProductId,
    double Rotation,
    string? RoomId,
    double? Elevation,
    string? LayerId,
    int DaliGroup
);

public record SaveDaliNetworkDto(
    string? Id,
    string ProjectId,
    string FloorplanId,
    string Name,
    int Revision,
    JsonElement Payload
);