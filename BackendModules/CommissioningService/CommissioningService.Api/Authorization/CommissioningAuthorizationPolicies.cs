using Microsoft.AspNetCore.Authorization;

namespace CommissioningService.Api.Authorization;

public static class CommissioningAuthorizationPolicies
{
    public const string ViewSession = "Commissioning.ViewSession";
    public const string ManageSession = "Commissioning.ManageSession";
    public const string ExecuteTests = "Commissioning.ExecuteTests";
    public const string SignOff = "Commissioning.SignOff";

    public static void RegisterPolicies(AuthorizationOptions options)
    {
        options.AddPolicy(ViewSession, policy =>
            policy.RequireClaim("permission", "commissioning:view"));

        options.AddPolicy(ManageSession, policy =>
            policy.RequireClaim("permission", "commissioning:manage"));

        options.AddPolicy(ExecuteTests, policy =>
            policy.RequireClaim("permission", "commissioning:test"));

        // Sign-off usually requires an elevated role
        options.AddPolicy(SignOff, policy =>
            policy.RequireAssertion(context =>
                context.User.HasClaim("permission", "commissioning:signoff") &&
                (context.User.IsInRole("Admin") || context.User.IsInRole("LeadEngineer"))));
    }
}