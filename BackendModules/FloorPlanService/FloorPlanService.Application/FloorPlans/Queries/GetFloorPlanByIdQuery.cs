// FloorPlanService.Application/FloorPlans/Queries/GetFloorPlanByIdQuery.cs

using MediatR;
using FloorPlanService.Application.DTOs;
using FloorPlanService.Domain.Interfaces;  // ← ADD THIS
using AutoMapper;
using System;

namespace FloorPlanService.Application.FloorPlans.Queries;

public class GetFloorPlanByIdQuery : IRequest<FloorPlanDto?>
{
    public Guid Id { get; }

    public GetFloorPlanByIdQuery(Guid id)
    {
        Id = id;
    }
}

public class GetFloorPlanByIdQueryHandler : IRequestHandler<GetFloorPlanByIdQuery, FloorPlanDto?>
{
    private readonly IFloorPlanRepository _repository;
    private readonly IMapper _mapper;

    public GetFloorPlanByIdQueryHandler(IFloorPlanRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<FloorPlanDto?> Handle(GetFloorPlanByIdQuery request, CancellationToken cancellationToken)
    {
        var floorPlan = await _repository.GetByIdAsync(request.Id, cancellationToken);
        
        if (floorPlan == null)
        {
            return null;
        }

        return _mapper.Map<FloorPlanDto>(floorPlan);
    }
}