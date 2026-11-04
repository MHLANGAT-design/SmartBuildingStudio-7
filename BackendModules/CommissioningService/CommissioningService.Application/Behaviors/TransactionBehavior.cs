using System.Threading;
using System.Threading.Tasks;
using MediatR;

namespace CommissioningService.Application.Behaviors;

// Placeholder for future unit of work interface
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class TransactionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IUnitOfWork _unitOfWork;

    public TransactionBehavior(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var response = await next();
        
        // Auto-save changes after a successful command
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        
        return response;
    }
}