using System;
using System.Collections.Generic;

namespace ProjectExplorerService.Api.Contracts;

public record CreateProjectRequest(
    string Name, 
    string Description, 
    string ClientName, 
    string ProjectNumber
);

public record CreateBuildingRequest(
    string Name,
    string Code,
    string? Address
);

public record CreateFloorRequest(
    string Name,
    int LevelNumber,
    double ElevationMeters,
    double FloorAreaSqMeters
);

// Document creation carries the initial floor-plan payload so the newly
// created document is immediately editable in FloorPlanDesigner without a
// follow-up save round-trip.
public record CreateDocumentRequest(
    string Name,
    int DocumentType,
    string? RoutePath,
    string? UploadedBy,
    long FileSizeInBytes,
    string? DrawnWallsJson,
    string? DefinedRoomsJson,
    string? PlacedFixturesJson,
    double? PixelsToMetresScale
);

// Body for all four rename endpoints.
// PUT /api/projectexplorer/{id}/rename
// PUT /api/projectexplorer/buildings/{id}/rename
// PUT /api/projectexplorer/floors/{id}/rename
// PUT /api/projectexplorer/documents/{id}/rename
public record RenameNodeRequest(string NewName);

public record DocumentResponse(
    Guid Id,
    string Name,
    int DocumentType,
    string RoutePath,
    int Version,
    string LastModifiedBy,
    string LastModifiedTimestamp,
    long FileSizeInBytes,
    bool IsLocked,
    string? LockedByUsername
);

public record FloorResponse(
    Guid Id,
    Guid BuildingId,
    string Name,
    int LevelNumber,
    double ElevationMeters,
    double FloorAreaSqMeters,
    IEnumerable<DocumentResponse> Documents,
    string LastModifiedTimestamp
);

public record BuildingResponse(
    Guid Id,
    Guid ProjectId,
    string Name,
    string Code,
    string? Address,
    IEnumerable<FloorResponse> Floors,
    string LastModifiedTimestamp
);

public record ProjectResponse(
    Guid Id,
    string Name,
    string Description,
    string ClientName,
    string ProjectNumber,
    IEnumerable<BuildingResponse> Buildings,
    bool IsArchived,
    string CreatedTimestamp,
    string LastModifiedTimestamp
);

public record ExplorerStatisticsResponse(
    Guid TargetId,
    int BuildingCount,
    int FloorCount,
    int TotalDrawingsCount,
    int FloorPlansCount,
    int FixtureLayoutsCount,
    int DaliNetworksCount,
    int EmergencyReportsCount,
    int ValidationErrorsCount,
    string LastModifiedTimestamp
);