using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace FloorPlanService.Infrastructure.Persistence;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<FloorPlanDbContext>
{
    public FloorPlanDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<FloorPlanDbContext>();
        builder.UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=FloorPlanServiceDb;Trusted_Connection=True;");
        return new FloorPlanDbContext(builder.Options);
    }
}
