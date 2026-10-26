using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.ValueObjects;

/// <summary>
/// One entry in a photometric candlepower table.
/// Angles are in degrees. Vertical 0 = straight down (nadir).
/// Horizontal 0 = reference plane; C0-C180 for bilateral distributions.
/// </summary>
public sealed class CandelaSample : ValueObject
{
    public double HorizontalAngle { get; }
    public double VerticalAngle { get; }
    public double Candela { get; }

    private CandelaSample() { }

    public CandelaSample(double horizontalAngle, double verticalAngle, double candela)
    {
        if (!double.IsFinite(horizontalAngle))
            throw new ArgumentException("HorizontalAngle must be finite.", nameof(horizontalAngle));
        if (!double.IsFinite(verticalAngle))
            throw new ArgumentException("VerticalAngle must be finite.", nameof(verticalAngle));
        if (!double.IsFinite(candela) || candela < 0)
            throw new ArgumentException("Candela must be finite and non-negative.", nameof(candela));

        HorizontalAngle = horizontalAngle;
        VerticalAngle = verticalAngle;
        Candela = candela;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return HorizontalAngle;
        yield return VerticalAngle;
        yield return Candela;
    }
}