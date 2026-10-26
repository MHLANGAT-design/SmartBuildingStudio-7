using BuildingBlocks.Domain;
using ProductCatalogService.Domain.Enums;

namespace ProductCatalogService.Domain.Entities;

public sealed class Certification : Entity
{
    public CertificationType Type { get; private set; }

    public string CertificateNumber { get; private set; }

    private Certification()
    {
        CertificateNumber = string.Empty;
    }

    public Certification(
        CertificationType type,
        string certificateNumber)
    {
        Type = type;
        CertificateNumber = certificateNumber;
    }
}
