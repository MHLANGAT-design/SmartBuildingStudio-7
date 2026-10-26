namespace ProductCatalogService.Domain.Exceptions;

/// <summary>
/// Thrown when an IES or LDT file can't be parsed. The message is
/// user-facing and appears in the upload dialog's error message.
/// </summary>
public sealed class IesParseException : Exception
{
    public IesParseException(string message) : base(message) { }
    public IesParseException(string message, Exception inner) : base(message, inner) { }
}