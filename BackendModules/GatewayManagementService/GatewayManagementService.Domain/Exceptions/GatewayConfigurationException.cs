using System;

namespace GatewayManagementService.Domain.Exceptions;

public sealed class GatewayConfigurationException : Exception
{
    public GatewayConfigurationException(string message) : base(message) { }
}