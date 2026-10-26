// FloorPlanService.Application/FloorPlans/Queries/GetAllFloorPlansQuery.cs

using MediatR;
using FloorPlanService.Application.DTOs;
using FloorPlanService.Domain.Interfaces;  // ← ADD THIS
using AutoMapper;

namespace FloorPlanService.Application.FloorPlans.Queries;

public class GetAllFloorPlansQuery : IRequest<FloorPlanDto[]>
{
}

public class GetAllFloorPlansQueryHandler : IRequestHandler<GetAllFloorPlansQuery, FloorPlanDto[]>
{
    private readonly IFloorPlanRepository _repository;
    private readonly IMapper _mapper;

    public GetAllFloorPlansQueryHandler(IFloorPlanRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<FloorPlanDto[]> Handle(GetAllFloorPlansQuery request, CancellationToken cancellationToken)
    {
        var floorPlans = await _repository.GetAllAsync(cancellationToken);
        return _mapper.Map<FloorPlanDto[]>(floorPlans);
    }
}