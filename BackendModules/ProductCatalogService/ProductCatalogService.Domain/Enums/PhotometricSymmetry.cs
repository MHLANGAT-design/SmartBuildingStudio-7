namespace ProductCatalogService.Domain.Enums;

/// <summary>
/// Symmetry of the candela distribution about the vertical axis.
/// Drives sampling reduction in the illuminance calculator.
/// </summary>
public enum PhotometricSymmetry
{
    None = 0,
    Rotational = 1,
    Quadrantal = 2,
    Bilateral = 3,
}