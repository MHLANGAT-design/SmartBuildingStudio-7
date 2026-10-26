namespace ProductCatalogService.Application.DTOs;

public sealed record ProductDto(
    Guid Id,
    string ProductCode,
    string Name,
    string ProductType,
    decimal Wattage,
    decimal Lumens,
    decimal Cri,
    decimal ColorTemperature,
    string Manufacturer,
    /// <summary>
    /// Product family / series (e.g. "premium (PRE)", "Xitanium",
    /// "CoreLine"). Null when the vendor data doesn't declare one.
    /// </summary>
    string? Family = null,
    /// <summary>
    /// Opaque JSON payload preserving manufacturer-specific fields
    /// (electrical specs, certifications, dimming features, etc.).
    /// Null when the product has no extended data.
    /// </summary>
    string? Specifications = null
);