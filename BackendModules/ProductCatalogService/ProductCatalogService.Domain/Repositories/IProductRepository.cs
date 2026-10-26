using ProductCatalogService.Domain.Entities;

namespace ProductCatalogService.Domain.Repositories;

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id);

    Task AddAsync(Product product);

    Task UpdateAsync(Product product);

    Task DeleteAsync(Guid id);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Explicitly mark a child entity as "new" in the change tracker. Use
    /// this when adding an entity to a tracked aggregate's navigation
    /// collection — EF's key-based heuristic assumes a non-empty PK means
    /// "existing entity", which is wrong when the base Entity assigns
    /// Id = Guid.NewGuid() in its constructor.
    /// </summary>
    Task TrackAsNewAsync(PhotometricFile file, CancellationToken cancellationToken = default);
}