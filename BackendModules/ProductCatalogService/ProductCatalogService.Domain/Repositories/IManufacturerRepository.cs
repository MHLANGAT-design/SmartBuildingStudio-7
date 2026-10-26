using ProductCatalogService.Domain.Entities;

namespace ProductCatalogService.Domain.Repositories;

public interface IManufacturerRepository
{
    Task<Manufacturer?> GetByIdAsync(Guid id);

    Task AddAsync(Manufacturer manufacturer);
}