using System;
using System.Collections.Generic;

namespace FloorPlanService.Domain.Models
{
    public class DxfArchitecturalPlan
    {
        public string FileId { get; init; }
        public DxfStructureType Fingerprint { get; private set; }
        private readonly List<VectorEntity> _elements = new();
        public IReadOnlyCollection<VectorEntity> Elements => _elements.AsReadOnly();

        public DxfArchitecturalPlan(string fileId, DxfStructureType fingerprint)
        {
            FileId = !string.IsNullOrWhiteSpace(fileId) ? fileId : throw new ArgumentNullException(nameof(fileId));
            Fingerprint = fingerprint;
        }

        public void AddElement(VectorEntity element)
        {
            if (element == null) throw new ArgumentNullException(nameof(element));
            _elements.Add(element);
        }

        public void AddElements(IEnumerable<VectorEntity> elements)
        {
            if (elements == null) throw new ArgumentNullException(nameof(elements));
            foreach (var element in elements)
            {
                _elements.Add(element);
            }
        }
    }
}
