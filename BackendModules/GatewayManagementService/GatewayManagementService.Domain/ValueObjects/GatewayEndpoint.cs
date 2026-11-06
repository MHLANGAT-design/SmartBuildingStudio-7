using System;
using System.Collections.Generic;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.ValueObjects;

public sealed class GatewayEndpoint : ValueObject
{
    public string Host { get; }
    public int Port { get; }
    public string? Path { get; }

    public GatewayEndpoint(string host, int port, string? path = null)
    {
        if (string.IsNullOrWhiteSpace(host))
            throw new ArgumentException("Host cannot be empty.", nameof(host));
        if (port < 1 || port > 65535)
            throw new ArgumentOutOfRangeException(nameof(port), "Port must be between 1 and 65535.");
        Host = host.Trim();
        Port = port;
        Path = path;
    }

    public override string ToString() =>
        string.IsNullOrEmpty(Path) ? $"{Host}:{Port}" : $"{Host}:{Port}/{Path.TrimStart('/')}";

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Host;
        yield return Port;
        yield return Path ?? string.Empty;
    }
}