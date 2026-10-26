// FloorPlanService.Application/Mappings/FloorPlanMappingProfile.cs

using AutoMapper;
using FloorPlanService.Application.DTOs;
using FloorPlanService.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace FloorPlanService.Application.Mappings;

public class FloorPlanMappingProfile : Profile
{
    public FloorPlanMappingProfile()
    {
        // FloorPlan → FloorPlanDto
        CreateMap<FloorPlan, FloorPlanDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Floors, opt => opt.MapFrom(src => src.Floors))
            .ForMember(dest => dest.PixelsToMetresScale, opt => opt.MapFrom(src => src.PixelsToMetresScale))
            // These are stored as JSON strings, will be populated from the controller
            .ForMember(dest => dest.Layers, opt => opt.Ignore())
            .ForMember(dest => dest.ImportedDrawings, opt => opt.Ignore())
            .ForMember(dest => dest.ElectricalFixtures, opt => opt.Ignore());

        // FloorPlanDto → FloorPlan
        CreateMap<FloorPlanDto, FloorPlan>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.Parse(src.Id)))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.PixelsToMetresScale, opt => opt.MapFrom(src => src.PixelsToMetresScale))
            .ForMember(dest => dest.Floors, opt => opt.MapFrom(src => src.Floors))
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.LastModified, opt => opt.Ignore())
            .ForMember(dest => dest.Version, opt => opt.Ignore());

        // Floor mappings
        CreateMap<Floor, Contracts.Documents.FloorDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.LevelIndex, opt => opt.MapFrom(src => src.LevelIndex))
            .ForMember(dest => dest.ElevationHeightMeters, opt => opt.MapFrom(src => src.ElevationHeightMeters))
            .ForMember(dest => dest.Walls, opt => opt.MapFrom(src => src.Walls))
            .ForMember(dest => dest.Doors, opt => opt.MapFrom(src => src.Doors))
            .ForMember(dest => dest.Windows, opt => opt.MapFrom(src => src.Windows))
            .ForMember(dest => dest.Rooms, opt => opt.MapFrom(src => src.Rooms));

        CreateMap<Contracts.Documents.FloorDto, Floor>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.Parse(src.Id)))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.LevelIndex, opt => opt.MapFrom(src => src.LevelIndex))
            .ForMember(dest => dest.ElevationHeightMeters, opt => opt.MapFrom(src => src.ElevationHeightMeters));

        // Wall mappings
        CreateMap<Wall, Contracts.Floors.WallDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Start, opt => opt.MapFrom(src => new Contracts.Common.PointDto(src.StartX, src.StartY)))
            .ForMember(dest => dest.End, opt => opt.MapFrom(src => new Contracts.Common.PointDto(src.EndX, src.EndY)))
            .ForMember(dest => dest.Thickness, opt => opt.MapFrom(src => src.Thickness))
            .ForMember(dest => dest.Height, opt => opt.MapFrom(src => src.Height))
            .ForMember(dest => dest.Material, opt => opt.MapFrom(src => src.Material))
            .ForMember(dest => dest.Style, opt => opt.Ignore());

        CreateMap<Contracts.Floors.WallDto, Wall>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.Parse(src.Id)))
            .ForMember(dest => dest.StartX, opt => opt.MapFrom(src => src.Start.X))
            .ForMember(dest => dest.StartY, opt => opt.MapFrom(src => src.Start.Y))
            .ForMember(dest => dest.EndX, opt => opt.MapFrom(src => src.End.X))
            .ForMember(dest => dest.EndY, opt => opt.MapFrom(src => src.End.Y))
            .ForMember(dest => dest.Thickness, opt => opt.MapFrom(src => src.Thickness))
            .ForMember(dest => dest.Height, opt => opt.MapFrom(src => src.Height))
            .ForMember(dest => dest.Material, opt => opt.MapFrom(src => src.Material));

        // Door mappings
        CreateMap<Door, Contracts.Floors.DoorDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.WallId, opt => opt.MapFrom(src => src.WallId))
            .ForMember(dest => dest.Position, opt => opt.MapFrom(src => new Contracts.Common.PointDto(src.X, src.Y)))
            .ForMember(dest => dest.Width, opt => opt.MapFrom(src => src.Width))
            .ForMember(dest => dest.Height, opt => opt.MapFrom(src => src.Height))
            .ForMember(dest => dest.DoorType, opt => opt.MapFrom(src => src.DoorType))
            .ForMember(dest => dest.Swing, opt => opt.MapFrom(src => src.Swing));

        CreateMap<Contracts.Floors.DoorDto, Door>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.Parse(src.Id)))
            .ForMember(dest => dest.WallId, opt => opt.MapFrom(src => src.WallId))
            .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.Position.X))
            .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.Position.Y))
            .ForMember(dest => dest.Width, opt => opt.MapFrom(src => src.Width))
            .ForMember(dest => dest.Height, opt => opt.MapFrom(src => src.Height))
            .ForMember(dest => dest.DoorType, opt => opt.MapFrom(src => src.DoorType))
            .ForMember(dest => dest.Swing, opt => opt.MapFrom(src => src.Swing));

        // Window mappings
        CreateMap<Window, Contracts.Floors.WindowDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.WallId, opt => opt.MapFrom(src => src.WallId))
            .ForMember(dest => dest.Position, opt => opt.MapFrom(src => new Contracts.Common.PointDto(src.X, src.Y)))
            .ForMember(dest => dest.Width, opt => opt.MapFrom(src => src.Width))
            .ForMember(dest => dest.Height, opt => opt.MapFrom(src => src.Height))
            .ForMember(dest => dest.Transmittance, opt => opt.MapFrom(src => src.Transmittance));

        CreateMap<Contracts.Floors.WindowDto, Window>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.Parse(src.Id)))
            .ForMember(dest => dest.WallId, opt => opt.MapFrom(src => src.WallId))
            .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.Position.X))
            .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.Position.Y))
            .ForMember(dest => dest.Width, opt => opt.MapFrom(src => src.Width))
            .ForMember(dest => dest.Height, opt => opt.MapFrom(src => src.Height))
            .ForMember(dest => dest.Transmittance, opt => opt.MapFrom(src => src.Transmittance));

        // Room mappings
        CreateMap<Room, Contracts.Floors.RoomDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Vertices, opt => opt.MapFrom(src => ParseVertices(src.VerticesJson)))
            .ForMember(dest => dest.TargetLux, opt => opt.MapFrom(src => src.TargetLux))
            .ForMember(dest => dest.SpaceType, opt => opt.MapFrom(src => src.SpaceType))
            .ForMember(dest => dest.Area, opt => opt.MapFrom(src => src.Area));

        CreateMap<Contracts.Floors.RoomDto, Room>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.Parse(src.Id)))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.VerticesJson, opt => opt.MapFrom(src => JsonSerializer.Serialize(src.Vertices)))
            .ForMember(dest => dest.TargetLux, opt => opt.MapFrom(src => src.TargetLux))
            .ForMember(dest => dest.SpaceType, opt => opt.MapFrom(src => src.SpaceType))
            .ForMember(dest => dest.Area, opt => opt.MapFrom(src => src.Area));
    }

    private static Contracts.Common.PointDto[] ParseVertices(string verticesJson)
    {
        if (string.IsNullOrEmpty(verticesJson) || verticesJson == "[]")
            return Array.Empty<Contracts.Common.PointDto>();

        try
        {
            return JsonSerializer.Deserialize<Contracts.Common.PointDto[]>(verticesJson) 
                   ?? Array.Empty<Contracts.Common.PointDto>();
        }
        catch
        {
            return Array.Empty<Contracts.Common.PointDto>();
        }
    }
}