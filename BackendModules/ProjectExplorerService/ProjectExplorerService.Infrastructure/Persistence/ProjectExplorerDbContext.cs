using Microsoft.EntityFrameworkCore;
using ProjectExplorerService.Domain.Aggregates.ProjectAggregate;

namespace ProjectExplorerService.Infrastructure.Persistence;

public class ProjectExplorerDbContext : DbContext
{
    public ProjectExplorerDbContext(DbContextOptions<ProjectExplorerDbContext> options) 
        : base(options) 
    { 
    }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Building> Buildings => Set<Building>();
    public DbSet<Floor> Floors => Set<Floor>();
    public DbSet<ProjectDocument> Documents => Set<ProjectDocument>();
    public DbSet<DaliNetwork> DaliNetworks => Set<DaliNetwork>();   // ← NEW

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map Project Entity
        modelBuilder.Entity<Project>(builder =>
        {
            builder.ToTable("Projects");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
            builder.Property(p => p.Description).HasMaxLength(1000);
            builder.Property(p => p.ClientName).IsRequired().HasMaxLength(200);
            builder.Property(p => p.ProjectNumber).IsRequired().HasMaxLength(50);
            builder.Property(p => p.IsArchived).IsRequired();
            builder.Property(p => p.CreatedTimestamp).IsRequired().HasMaxLength(50);
            builder.Property(p => p.LastModifiedTimestamp).IsRequired().HasMaxLength(50);

            builder.HasIndex(p => p.ProjectNumber).IsUnique();

            builder.HasMany(p => p.Buildings)
                   .WithOne()
                   .HasForeignKey("ProjectId")
                   .IsRequired(false)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        // Map Building Entity
        modelBuilder.Entity<Building>(builder =>
        {
            builder.ToTable("Buildings");
            builder.HasKey(b => b.Id);
            builder.Property(b => b.Name).IsRequired().HasMaxLength(200);
            builder.Property(b => b.Code).IsRequired().HasMaxLength(50);
            builder.Property(b => b.Address).HasMaxLength(500);
            builder.Property(b => b.LastModifiedTimestamp).IsRequired().HasMaxLength(50);

            builder.HasMany(b => b.Floors)
                   .WithOne()
                   .HasForeignKey("BuildingId")
                   .IsRequired(false)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        // Map Floor Entity
        modelBuilder.Entity<Floor>(builder =>
        {
            builder.ToTable("Floors");
            builder.HasKey(f => f.Id);
            builder.Property(f => f.Name).IsRequired().HasMaxLength(200);
            builder.Property(f => f.LevelNumber).IsRequired();
            builder.Property(f => f.ElevationMeters).IsRequired();
            builder.Property(f => f.FloorAreaSqMeters).IsRequired();
            builder.Property(f => f.LastModifiedTimestamp).IsRequired().HasMaxLength(50);

            builder.HasMany(f => f.Documents)
                   .WithOne()
                   .HasForeignKey("FloorId")
                   .IsRequired(false)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        // Map ProjectDocument Entity
        modelBuilder.Entity<ProjectDocument>(builder =>
        {
            builder.ToTable("ProjectDocuments");
            builder.HasKey(d => d.Id);
            builder.Property(d => d.Name).IsRequired().HasMaxLength(255);
            builder.Property(d => d.DocumentType).IsRequired();
            builder.Property(d => d.RoutePath).IsRequired().HasMaxLength(500);
            builder.Property(d => d.Version).IsRequired();
            builder.Property(d => d.LastModifiedBy).IsRequired().HasMaxLength(200);
            builder.Property(d => d.LastModifiedTimestamp).IsRequired().HasMaxLength(50);
            builder.Property(d => d.FileSizeInBytes).IsRequired();
            builder.Property(d => d.IsLocked).IsRequired();
            builder.Property(d => d.LockedByUsername).HasMaxLength(200);

            // ✅ NEW CONFIGURATIONS FOR FLOOR PLAN DATA (large JSON storage)
            builder.Property(d => d.DrawnWallsJson)
                   .HasColumnType("nvarchar(max)");

            builder.Property(d => d.DefinedRoomsJson)
                   .HasColumnType("nvarchar(max)");

            builder.Property(d => d.PlacedFixturesJson)
                   .HasColumnType("nvarchar(max)");

            // PixelsToMetresScale is a double; no length needed, but we can set a default via Fluent if desired.
            // It already has a default in the constructor, so we don't need to set IsRequired.
            builder.Property(d => d.PixelsToMetresScale)
                   .HasDefaultValue(1.0); // Optional, but ensures DB default matches code.
        });

        // Map DaliNetwork Entity
        //
        // One ProjectDocument → many DaliNetworks. The payload is a
        // raw JSON string owned by the DaliDesigner module; ProjectExplorer
        // stores it verbatim and never inspects it.
        modelBuilder.Entity<DaliNetwork>(builder =>
        {
            builder.ToTable("DaliNetworks");
            builder.HasKey(n => n.Id);

            // Id is a client-generated string (e.g. "dn_abc123"), not a GUID.
            // 64 chars is generous; the DALI module's own generator produces
            // far shorter tokens.
            builder.Property(n => n.Id)
                   .HasMaxLength(64)
                   .IsRequired();

            builder.Property(n => n.DocumentId)
                   .IsRequired();

            builder.Property(n => n.Name)
                   .HasMaxLength(256)
                   .IsRequired();

            builder.Property(n => n.Revision)
                   .IsRequired();

            builder.Property(n => n.PayloadJson)
                   .HasColumnType("nvarchar(max)")
                   .IsRequired();

            builder.Property(n => n.CreatedAt)
                   .HasMaxLength(50)
                   .IsRequired();

            builder.Property(n => n.UpdatedAt)
                   .HasMaxLength(50)
                   .IsRequired();

            // Cascade: deleting a floorplan document removes its networks.
            builder.HasOne<ProjectDocument>()
                   .WithMany()
                   .HasForeignKey(n => n.DocumentId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Cascade);

            // Common lookup: "all networks for a document".
            builder.HasIndex(n => n.DocumentId);
        });
    }
}