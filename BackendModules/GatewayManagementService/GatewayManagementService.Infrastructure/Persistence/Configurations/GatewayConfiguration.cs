// GatewayManagementService.Infrastructure/Persistence/Configurations/GatewayConfiguration.cs

using GatewayManagementService.Domain.Aggregates;
using GatewayManagementService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GatewayManagementService.Infrastructure.Persistence.Configurations;

public sealed class GatewayConfiguration : IEntityTypeConfiguration<Gateway>
{
    public void Configure(EntityTypeBuilder<Gateway> builder)
    {
        builder.ToTable("Gateways");
        builder.HasKey(g => g.Id);

        builder.Property(g => g.Id)
            .HasConversion(
                v => v.Value,
                v => new GatewayId(v))
            .HasColumnName("Id");

        builder.Property(g => g.Name)
            .HasConversion(
                v => v.Value,
                v => new GatewayName(v))
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(g => g.Identifier)
            .HasConversion(
                v => v.Value,
                v => new GatewayIdentifier(v))
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(g => g.Transport)
            .HasConversion(
                v => v.Value.ToString(),
                v => new TransportProtocol(Enum.Parse<TransportProtocol.ProtocolValue>(v, true)))
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(g => g.DaliProtocol)
            .HasConversion(
                v => v.Value.ToString(),
                v => new DaliProtocol(Enum.Parse<DaliProtocol.ProtocolValue>(v, true)))
            .HasMaxLength(32)
            .IsRequired();

        builder.OwnsOne(g => g.Endpoint, ep =>
        {
            ep.Property(e => e.Host).HasColumnName("EndpointHost").HasMaxLength(256).IsRequired();
            ep.Property(e => e.Port).HasColumnName("EndpointPort").IsRequired();
            ep.Property(e => e.Path).HasColumnName("EndpointPath").HasMaxLength(512);
        });

        builder.OwnsOne(g => g.Configuration, cfg =>
        {
            cfg.Property(c => c.DaliLineCount).HasColumnName("DaliLineCount").IsRequired();
            cfg.Property(c => c.PollingIntervalSeconds).HasColumnName("PollingIntervalSeconds").IsRequired();
            cfg.Property(c => c.CommandTimeoutSeconds).HasColumnName("CommandTimeoutSeconds").IsRequired();
            cfg.Property(c => c.AuthToken).HasColumnName("AuthToken").HasMaxLength(512);
        });

        builder.Property(g => g.ConnectionStatus)
            .HasConversion(
                v => v.Value.ToString(),
                v => new ConnectionStatus(Enum.Parse<ConnectionStatus.StatusValue>(v, true)))
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(g => g.LastConnectedAt);
        builder.Property(g => g.LastSeenAt);
        builder.Property(g => g.LastErrorMessage).HasMaxLength(2048);

        // Read-only collection navigations.
        // EF Core resolves the backing fields (_operations, _events,
        // _connectionHistory, _assignments) by convention from the
        // read-only properties (Operations, Events, ConnectionHistory,
        // Assignments). No explicit HasMany configuration is needed —
        // and adding one causes the "cannot use field X because it is
        // already used by Y" error.
        builder.Metadata
            .FindNavigation(nameof(Gateway.Operations))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);
        builder.Metadata
            .FindNavigation(nameof(Gateway.Events))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);
        builder.Metadata
            .FindNavigation(nameof(Gateway.ConnectionHistory))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);
        builder.Metadata
            .FindNavigation(nameof(Gateway.Assignments))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(g => g.DomainEvents);
    }
}