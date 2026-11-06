// GatewayManagementService.Application/ApplicationMarker.cs

namespace GatewayManagementService.Application;

/// <summary>
/// Assembly marker. Used by DI registration to reference the Application
/// assembly without hard-coding a type name at the call site.
/// </summary>
public sealed class ApplicationMarker { }