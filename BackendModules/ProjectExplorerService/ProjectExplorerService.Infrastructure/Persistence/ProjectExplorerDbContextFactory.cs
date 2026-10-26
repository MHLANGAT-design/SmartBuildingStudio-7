using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ProjectExplorerService.Infrastructure.Persistence;

/// <summary>
/// Standard isolated design-time factory enabling the EF Core CLI tools to resolve 
/// the SqlServer provider dependencies seamlessly during code structural migrations.
/// </summary>
public sealed class ProjectExplorerDbContextFactory : IDesignTimeDbContextFactory<ProjectExplorerDbContext>
{
    public ProjectExplorerDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ProjectExplorerDbContext>();
        
        // Direct local string fallback to completely bypass file system assembly traversal checks
        string connectionString = "Server=(localdb)\\mssqllocaldb;Database=SmartBuildingStudio_ProjectExplorer;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";
        
        optionsBuilder.UseSqlServer(connectionString, b => b.MigrationsAssembly("ProjectExplorerService.Infrastructure"));

        return new ProjectExplorerDbContext(optionsBuilder.Options);
    }
}
