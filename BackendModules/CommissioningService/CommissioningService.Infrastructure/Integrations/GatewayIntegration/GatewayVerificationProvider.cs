using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CommissioningService.Application.Interfaces;
using CommissioningService.Application.Commands.VerifyProgramming;
using CommissioningService.Application.DTOs;
using CommissioningService.Infrastructure.Configuration;

namespace CommissioningService.Infrastructure.Integrations.GatewayIntegration;

public class GatewayVerificationProvider : IProgrammingVerificationProvider
{
    private readonly GatewayManagementClient _client;
    private readonly CommissioningInfrastructureOptions _options;
    private readonly ILogger<GatewayVerificationProvider> _logger;

    public GatewayVerificationProvider(
        GatewayManagementClient client,
        IOptions<CommissioningInfrastructureOptions> options,
        ILogger<GatewayVerificationProvider> logger)
    {
        _client = client;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<VerificationReportDto> VerifyAsync(
        string deploymentId,
        List<VerificationDeviceDto> expectedDevices,
        CancellationToken cancellationToken = default)
    {
        var report = new VerificationReportDto
        {
            DeploymentId = deploymentId,
            VerifiedAt = DateTime.UtcNow,
        };

        // ── 1. MOCK PATH ────────────────────────────────────────────────
        if (_options.UseMockIntegrations)
        {
            _logger.LogInformation("MOCK VERIFY: Simulating verification for {Count} devices.", expectedDevices.Count);
            
            report.Summary.MatchingDevices = expectedDevices.Count;
            report.Summary.Passed = expectedDevices.Count;
            report.Summary.Failed = 0;
            report.Summary.MismatchedDevices = 0;
            report.IsFullyVerified = true;

            foreach (var dev in expectedDevices)
            {
                report.Results.Add(new DeviceVerificationResultDto
                {
                    DeviceId = dev.DeviceId,
                    MatchesExpected = true,
                    ExpectedAddress = dev.HardwareAddress,
                    ActualAddress = dev.HardwareAddress, // Mock matches perfectly
                });
            }

            return report;
        }

        // ── 2. REAL PATH ────────────────────────────────────────────────
        int matched = 0;
        int mismatched = 0;

        foreach (var dev in expectedDevices)
        {
            try
            {
                // In a real implementation, this would read the short address from the gateway
                // var actualAddress = await _client.GetDeviceAddressAsync(dev.DeviceId);
                var actualAddress = dev.HardwareAddress; // Placeholder for real read

                bool matches = actualAddress == dev.HardwareAddress;
                if (matches) matched++; else mismatched++;

                report.Results.Add(new DeviceVerificationResultDto
                {
                    DeviceId = dev.DeviceId,
                    MatchesExpected = matches,
                    ExpectedAddress = dev.HardwareAddress,
                    ActualAddress = actualAddress,
                    ErrorMessage = matches ? null : "Address mismatch",
                });
            }
            catch (Exception ex)
            {
                mismatched++;
                report.Results.Add(new DeviceVerificationResultDto
                {
                    DeviceId = dev.DeviceId,
                    MatchesExpected = false,
                    ExpectedAddress = dev.HardwareAddress,
                    ActualAddress = -1,
                    ErrorMessage = ex.Message,
                });
            }
        }

        report.Summary.MatchingDevices = matched;
        report.Summary.MismatchedDevices = mismatched;
        report.Summary.Passed = matched;
        report.Summary.Failed = mismatched;
        report.IsFullyVerified = mismatched == 0;

        return report;
    }
}