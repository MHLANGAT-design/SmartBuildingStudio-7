using BuildingBlocks.Domain;
using ProductCatalogService.Domain.Enums;
using ProductCatalogService.Domain.ValueObjects;

namespace ProductCatalogService.Domain.Entities;

public sealed class Product : Entity
{
    private readonly List<Certification> _certifications = [];
    private readonly List<Datasheet> _datasheets = [];
    private readonly List<PhotometricFile> _photometricFiles = [];

    public ProductCode ProductCode { get; private set; }

    public string Name { get; private set; }

    public ProductType ProductType { get; private set; }

    public ProductSpecification Specification { get; private set; }

    public ProductDimensions Dimensions { get; private set; }

    /// <summary>
    /// Manufacturer name (e.g. "Tridonic", "Philips"). Denormalized from
    /// the Manufacturer entity so the read/write path stays simple;
    /// migrate to a ManufacturerId FK when relational queries are needed.
    /// </summary>
    public string Manufacturer { get; private set; }

    /// <summary>
    /// Product family / series (e.g. "premium (PRE)", "Xitanium",
    /// "CoreLine"). Nullable — not all products carry a family in their
    /// vendor data, and seed/demo products typically don't. Null means
    /// "no family declared", not "unknown family".
    /// </summary>
    public string? Family { get; private set; }

    /// <summary>
    /// Opaque JSON carrying manufacturer-specific fields (electrical
    /// specs, dimming features, certifications, etc.). Null when the
    /// product was created through the plain CSV/API paths and carries
    /// no extended data.
    ///
    /// Stored as text so adding vendor-specific fields does not require
    /// schema changes. See scripts/import-catalogs/README.md.
    /// </summary>
    public string? Specifications { get; private set; }

    public IReadOnlyCollection<Certification> Certifications => _certifications;

    public IReadOnlyCollection<Datasheet> Datasheets => _datasheets;

    public IReadOnlyCollection<PhotometricFile> PhotometricFiles => _photometricFiles;

    private Product()
    {
        Name = string.Empty;
        ProductCode = new ProductCode("UNKNOWN");
        Specification = new ProductSpecification(0, 0, 0, 0);
        Dimensions = new ProductDimensions(0, 0, 0);
        Manufacturer = string.Empty;
    }

    public Product(
        ProductCode productCode,
        string name,
        ProductType productType,
        ProductSpecification specification,
        ProductDimensions dimensions,
        string manufacturer,
        string? family = null,
        string? specifications = null)
    {
        ProductCode = productCode;
        Name = name;
        ProductType = productType;
        Specification = specification;
        Dimensions = dimensions;
        Manufacturer = manufacturer;
        Family = family;
        Specifications = specifications;
    }

    public void AddDatasheet(Datasheet datasheet) => _datasheets.Add(datasheet);

    public void AddPhotometricFile(PhotometricFile file) => _photometricFiles.Add(file);

    public void AddCertification(Certification certification) => _certifications.Add(certification);
}