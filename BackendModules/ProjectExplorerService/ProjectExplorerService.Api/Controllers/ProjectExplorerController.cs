using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectExplorerService.Api.Contracts;
using ProjectExplorerService.Domain.Aggregates.ProjectAggregate;
using ProjectExplorerService.Domain.RepositoryContracts;
using ProjectExplorerService.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ProjectExplorerService.Api.Controllers;

[ApiController]
[Route("api/projectexplorer")]
public class ProjectExplorerController : ControllerBase
{
    private readonly IProjectRepository _projectRepository;
    private readonly ProjectExplorerDbContext _context;

    public ProjectExplorerController(IProjectRepository projectRepository, ProjectExplorerDbContext context)
    {
        _projectRepository = projectRepository;
        _context = context;
    }

    private static string NowIso() => DateTime.UtcNow.ToString("o");

    // ────────────────────────────────────────────────────────────────────
    // TREE
    // ────────────────────────────────────────────────────────────────────

    [HttpGet("tree")]
    public async Task<ActionResult<IEnumerable<ProjectResponse>>> GetTree(CancellationToken cancellationToken)
    {
        var response = await _context.Projects
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .Select(proj => new ProjectResponse(
                proj.Id,
                proj.Name,
                proj.Description ?? "Smart LED & DALI Management Workspace Layer",
                proj.ClientName,
                proj.ProjectNumber,
                proj.Buildings
                    .OrderBy(b => b.Name)
                    .Select(bldg => new BuildingResponse(
                        bldg.Id,
                        bldg.ProjectId,
                        bldg.Name,
                        bldg.Code,
                        bldg.Address ?? "N/A",
                        bldg.Floors
                            .OrderBy(f => f.LevelNumber)
                            .Select(floor => new FloorResponse(
                                floor.Id,
                                floor.BuildingId,
                                floor.Name,
                                floor.LevelNumber,
                                floor.ElevationMeters,
                                floor.FloorAreaSqMeters,
                                floor.Documents
                                    .OrderBy(d => d.Name)
                                    .Select(doc => new DocumentResponse(
                                        doc.Id,
                                        doc.Name,
                                        doc.DocumentType,
                                        doc.RoutePath,
                                        doc.Version,
                                        doc.LastModifiedBy,
                                        doc.LastModifiedTimestamp,
                                        doc.FileSizeInBytes,
                                        doc.IsLocked,          // ← real value from DB
                                        doc.LockedByUsername   // ← real value from DB
                                    ))
                                    .ToList(),
                                floor.LastModifiedTimestamp
                            ))
                            .ToList(),
                        bldg.LastModifiedTimestamp
                    ))
                    .ToList(),
                proj.IsArchived,
                proj.CreatedTimestamp,
                proj.LastModifiedTimestamp
            ))
            .ToListAsync(cancellationToken);

        return Ok(response);
    }

    // ────────────────────────────────────────────────────────────────────
    // PROJECTS
    // ────────────────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<ActionResult<ProjectResponse>> CreateProject(
        [FromBody] CreateProjectRequest request,
        CancellationToken cancellationToken)
    {
        var projectId = Guid.NewGuid();
        var currentTimestamp = NowIso();

        var newProject = new Project(
            projectId, request.Name, request.Description ?? "Smart LED & DALI Management Workspace Layer",
            request.ClientName, request.ProjectNumber, currentTimestamp
        );

        await _projectRepository.AddAsync(newProject, cancellationToken);

        var response = new ProjectResponse(
            Id: projectId, Name: newProject.Name, Description: newProject.Description,
            ClientName: newProject.ClientName, ProjectNumber: newProject.ProjectNumber,
            Buildings: Array.Empty<BuildingResponse>(), IsArchived: false,
            CreatedTimestamp: currentTimestamp, LastModifiedTimestamp: currentTimestamp
        );

        return CreatedAtAction(nameof(GetTree), new { id = projectId }, response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProject(Guid id, CancellationToken cancellationToken)
    {
        var existingProject = await _projectRepository.GetByIdAsync(id, cancellationToken);
        if (existingProject != null)
        {
            await _projectRepository.DeleteAsync(existingProject, cancellationToken);
        }
        return NoContent();
    }

    /// <summary>
    /// PUT /api/projectexplorer/{id}/rename
    /// Renames a project.
    /// </summary>
    [HttpPut("{id:guid}/rename")]
    public async Task<IActionResult> RenameProject(
        Guid id,
        [FromBody] RenameNodeRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.NewName))
            return BadRequest(new { message = "NewName is required." });

        var project = await _context.Set<Project>()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (project == null)
            return NotFound(new { message = $"Project '{id}' not found." });

        project.Rename(request.NewName, NowIso());
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    // ────────────────────────────────────────────────────────────────────
    // BUILDINGS
    // ────────────────────────────────────────────────────────────────────

    [HttpPost("projects/{projectId:guid}/buildings")]
    public async Task<ActionResult> AddBuilding(
        Guid projectId,
        [FromBody] CreateBuildingRequest request,
        CancellationToken cancellationToken)
    {
        var currentTimestamp = NowIso();
        var buildingId = Guid.NewGuid();

        var newBuilding = new Building(
            buildingId,
            projectId,
            request.Name,
            request.Code,
            request.Address ?? "Default Workspace Location",
            currentTimestamp
        );

        _context.Set<Building>().Add(newBuilding);
        // SaveChanges is applied by AutomaticUnitOfWorkFilter after the action returns.

        return Ok(new { id = buildingId.ToString() });
    }

    [HttpDelete("buildings/{id:guid}")]
    public async Task<IActionResult> DeleteBuilding(Guid id, CancellationToken cancellationToken)
    {
        var building = await _context.Set<Building>()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (building == null)
        {
            return NoContent();
        }

        _context.Set<Building>().Remove(building);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// PUT /api/projectexplorer/buildings/{id}/rename
    /// Renames a building.
    /// </summary>
    [HttpPut("buildings/{id:guid}/rename")]
    public async Task<IActionResult> RenameBuilding(
        Guid id,
        [FromBody] RenameNodeRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.NewName))
            return BadRequest(new { message = "NewName is required." });

        var building = await _context.Set<Building>()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (building == null)
            return NotFound(new { message = $"Building '{id}' not found." });

        building.Rename(request.NewName, NowIso());
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    // ────────────────────────────────────────────────────────────────────
    // FLOORS
    // ────────────────────────────────────────────────────────────────────

    [HttpPost("buildings/{buildingId:guid}/floors")]
    public async Task<ActionResult> AddFloor(
        Guid buildingId,
        [FromBody] CreateFloorRequest request,
        CancellationToken cancellationToken)
    {
        var currentTimestamp = NowIso();
        var floorId = Guid.NewGuid();

        var newFloor = new Floor(
            floorId,
            buildingId,
            request.Name,
            request.LevelNumber,
            request.ElevationMeters,
            request.FloorAreaSqMeters,
            currentTimestamp
        );

        _context.Set<Floor>().Add(newFloor);
        // SaveChanges is applied by AutomaticUnitOfWorkFilter after the action returns.

        return Ok(new { id = floorId.ToString() });
    }

    [HttpDelete("floors/{id:guid}")]
    public async Task<IActionResult> DeleteFloor(Guid id, CancellationToken cancellationToken)
    {
        var floor = await _context.Set<Floor>()
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

        if (floor == null)
        {
            return NoContent();
        }

        _context.Set<Floor>().Remove(floor);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// PUT /api/projectexplorer/floors/{id}/rename
    /// Renames a floor.
    /// </summary>
    [HttpPut("floors/{id:guid}/rename")]
    public async Task<IActionResult> RenameFloor(
        Guid id,
        [FromBody] RenameNodeRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.NewName))
            return BadRequest(new { message = "NewName is required." });

        var floor = await _context.Set<Floor>()
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

        if (floor == null)
            return NotFound(new { message = $"Floor '{id}' not found." });

        floor.Rename(request.NewName, NowIso());
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    // ────────────────────────────────────────────────────────────────────
    // DOCUMENTS
    // ────────────────────────────────────────────────────────────────────

    [HttpPost("floors/{floorId:guid}/documents")]
    public async Task<ActionResult> AddDocument(
        Guid floorId,
        [FromBody] CreateDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var currentTimestamp = NowIso();
        var documentId = Guid.NewGuid();

        var newDocument = new ProjectDocument(
            documentId,
            request.Name,
            request.DocumentType,
            request.RoutePath ?? $"/viewer/doc-{documentId.ToString().Substring(0, 5)}",
            1,
            request.UploadedBy ?? "Studio System",
            currentTimestamp,
            request.FileSizeInBytes > 0 ? request.FileSizeInBytes : 4194304
        );

        var hasPayload =
            !string.IsNullOrWhiteSpace(request.DrawnWallsJson) ||
            !string.IsNullOrWhiteSpace(request.DefinedRoomsJson) ||
            !string.IsNullOrWhiteSpace(request.PlacedFixturesJson);

        if (hasPayload)
        {
            newDocument.UpdateFloorPlanData(
                request.DrawnWallsJson ?? "{\"walls\":[],\"doors\":[],\"windows\":[]}",
                request.DefinedRoomsJson ?? "[]",
                request.PlacedFixturesJson ?? "{\"importedDrawings\":[],\"electricalFixtures\":[]}",
                request.PixelsToMetresScale ?? 1.0,
                request.UploadedBy ?? "Studio System",
                currentTimestamp,
                request.Name
            );
        }

        _context.Entry(newDocument).Property("FloorId").CurrentValue = floorId;
        _context.Set<ProjectDocument>().Add(newDocument);
        // SaveChanges is applied by AutomaticUnitOfWorkFilter after the action returns.

        return Ok(new
        {
            id = documentId.ToString(),
            documentId = documentId.ToString(),
            name = newDocument.Name,
            floorId = floorId.ToString(),
            message = "Document created successfully"
        });
    }

    [HttpDelete("documents/{id:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid id, CancellationToken cancellationToken)
    {
        var document = await _context.Set<ProjectDocument>()
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (document == null)
        {
            return NoContent();
        }

        _context.Set<ProjectDocument>().Remove(document);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// PUT /api/projectexplorer/documents/{id}/rename
    /// Renames a document.
    /// </summary>
    [HttpPut("documents/{id:guid}/rename")]
    public async Task<IActionResult> RenameDocument(
        Guid id,
        [FromBody] RenameNodeRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.NewName))
            return BadRequest(new { message = "NewName is required." });

        var document = await _context.Set<ProjectDocument>()
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (document == null)
            return NotFound(new { message = $"Document '{id}' not found." });

        document.UpdateName(request.NewName, "Studio System", NowIso());
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    // ────────────────────────────────────────────────────────────────────
    // STATISTICS
    // ────────────────────────────────────────────────────────────────────

    [HttpGet("statistics")]
    public ActionResult<ExplorerStatisticsResponse> GetStatistics([FromQuery] Guid nodeId)
    {
        return Ok(new ExplorerStatisticsResponse(
            nodeId, 0, 0, 0, 0, 0, 0, 0, 0,
            NowIso()
        ));
    }
}