using System;
using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Integrations.DaliDesignIntegration;

public class DaliDesignRevisionResolver
{
    private readonly DaliDesignClient _client;
    public DaliDesignRevisionResolver(DaliDesignClient client) => _client = client;

    public async Task<bool> HasDesignChangedAsync(Guid floorplanId, string currentRevision, CancellationToken cancellationToken)
    {
        var latest = await _client.GetDesignRevisionAsync(floorplanId, cancellationToken);
        return latest != currentRevision;
    }
}