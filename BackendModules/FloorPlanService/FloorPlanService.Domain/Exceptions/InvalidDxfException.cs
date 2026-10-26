using System;

namespace FloorPlanService.Domain.Exceptions;

public class InvalidDxfException : Exception
{
    public InvalidDxfException(string message) : base(message) { }
    public InvalidDxfException(string message, Exception inner) : base(message, inner) { }
}
