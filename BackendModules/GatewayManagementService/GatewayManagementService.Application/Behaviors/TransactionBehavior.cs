// GatewayManagementService.Application/Behaviors/TransactionBehavior.cs

using MediatR;

namespace GatewayManagementService.Application.Behaviors;

/// <summary>
/// Marker interface for commands that must run inside a database transaction.
/// The actual transaction wrapping happens in the Infrastructure layer via an
/// IUnitOfWork abstraction; this behavior is a no-op placeholder that the
/// Infrastructure registers a concrete implementation for via DI replacement.
/// </summary>
public interface ITransactionalCommand { }

public sealed class TransactionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // No-op in Application. Infrastructure swaps this for a DbContext-backed
        // version that wraps `next()` in BeginTransaction/Commit/Rollback.
        return next();
    }
}