using System.Threading;
using System.Threading.Tasks;

namespace CommissioningService.Infrastructure.Integrations.DaliProgrammingIntegration;

public class ProgrammingResultResolver
{
    private readonly DaliProgrammingClient _client;
    public ProgrammingResultResolver(DaliProgrammingClient client) => _client = client;
}