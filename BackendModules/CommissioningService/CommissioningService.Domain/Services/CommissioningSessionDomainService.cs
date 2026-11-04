using System;
using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.Entities;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Domain.Policies;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Services;

public class CommissioningSessionDomainService
{
    /// <summary>
    /// Validates and executes the start of the discovery phase.
    /// </summary>
    public void StartDiscovery(CommissioningSession session)
    {
        if (session.Status.Value != CommissioningStatus.StatusValue.Idle)
        {
            throw new CommissioningSessionInvalidStateException(
                $"Cannot start discovery. Session is in {session.Status.Value} state.");
        }

        session.StartDiscovery();
    }

    /// <summary>
    /// Registers a newly discovered device into the session.
    /// </summary>
    public void RegisterDevice(CommissioningSession session, string externalDeviceId)
    {
        if (session.Status.Value != CommissioningStatus.StatusValue.Discovering)
        {
            throw new CommissioningSessionInvalidStateException(
                "Devices can only be registered while in the Discovering state.");
        }

        session.RegisterDiscoveredDevice(CommissioningDeviceId.New(), externalDeviceId);
    }

    /// <summary>
    /// Transitions the session from Discovering to Addressing.
    /// </summary>
    public void CompleteDiscovery(CommissioningSession session)
    {
        if (session.Status.Value != CommissioningStatus.StatusValue.Discovering)
        {
            throw new CommissioningSessionInvalidStateException(
                "Cannot complete discovery because the session is not in the Discovering state.");
        }

        if (session.Devices.Count == 0)
        {
            throw new CommissioningSessionInvalidStateException(
                "Cannot complete discovery because no devices were found.");
        }

        session.CompleteDiscovery();
    }

    /// <summary>
    /// Assigns an address to a device and validates the transition.
    /// </summary>
    public void AssignAddress(CommissioningSession session, string externalDeviceId, int addressValue)
    {
        if (session.Status.Value != CommissioningStatus.StatusValue.Addressing)
        {
            throw new CommissioningSessionInvalidStateException(
                "Addresses can only be assigned during the Addressing state.");
        }

        var device = System.Linq.Enumerable.FirstOrDefault(session.Devices, d => d.ExternalId == externalDeviceId);
        if (device == null)
        {
            throw new CommissioningDeviceNotFoundException(externalDeviceId);
        }

        var address = new DeviceAddress(addressValue);
        session.AssignDeviceAddress(device.Id, address);
    }

    /// <summary>
    /// Prepares the session to transition into the Testing phase.
    /// </summary>
    public void BeginTesting(CommissioningSession session)
    {
        if (session.Status.Value != CommissioningStatus.StatusValue.Addressing)
        {
            throw new CommissioningSessionInvalidStateException(
                "Session must be in Addressing state to begin Testing.");
        }

        var unaddressed = System.Linq.Enumerable.Where(session.Devices, d => !d.IsAddressed);
        if (System.Linq.Enumerable.Any(unaddressed))
        {
            throw new CommissioningSessionInvalidStateException(
                "All devices must be addressed before testing can begin.");
        }

        session.BeginTesting();
    }
}