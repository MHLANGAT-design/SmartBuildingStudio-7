using ProductCatalogService.Domain.Entities;

namespace ProductCatalogService.Domain.Repositories;

public interface IProductCategoryRepository
{
    Task<ProductCategory?> GetByIdAsync(Guid id);

    Task AddAsync(ProductCategory category);
}