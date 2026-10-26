using System;
using System.IO;
using FloorPlanService.Application.Interfaces;
using FloorPlanService.Domain.Models;

namespace FloorPlanService.Application.UseCases
{
    public class ImportFloorPlanCommandHandler
    {
        private readonly IDxfImportService _dxfImportService;

        public ImportFloorPlanCommandHandler(IDxfImportService dxfImportService)
        {
            _dxfImportService = dxfImportService ?? throw new ArgumentNullException(nameof(dxfImportService));
        }

        public DxfArchitecturalPlan Execute(Stream stream, string fileName)
        {
            string uniqueId = $"{Guid.NewGuid()}_{Path.GetFileNameWithoutExtension(fileName)}";
            return _dxfImportService.ImportDxf(stream, uniqueId);
        }
    }
}
