using ProjectExplorerService.Domain.Exceptions;

namespace ProjectExplorerService.Domain.ValueObjects;

public record ProjectNumber
{
    public string Value { get; }

    public ProjectNumber(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !value.StartsWith("PRJ-"))
        {
            throw new DomainException("Project number must be in the format 'PRJ-XXXX'.");
        }
        Value = value;
    }
}
