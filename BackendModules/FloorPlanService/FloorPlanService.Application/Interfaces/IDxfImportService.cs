using System.IO;
using FloorPlanService.Domain.Models;

namespace FloorPlanService.Application.Interfaces
{
    public interface IDxfImportService
    {
        DxfArchitecturalPlan ImportDxf(Stream fileStream, string fileId);
    }
}
