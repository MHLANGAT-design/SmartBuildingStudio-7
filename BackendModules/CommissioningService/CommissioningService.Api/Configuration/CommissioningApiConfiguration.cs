using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;

namespace CommissioningService.Api.Configuration;

public static class CommissioningApiConfiguration
{
    public static IServiceCollection AddCommissioningApiConfiguration(this IServiceCollection services)
    {
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                // Ensure enums serialize to strings to match the frontend's expectations
                options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
                // Handle camelCase from the React frontend
                options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            });

        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo 
            { 
                Title = "CommissioningService API", 
                Version = "v1",
                Description = "API for the Smart Building Studio Commissioning Module."
            });
        });

        return services;
    }
}