using System;
using System.Collections.Generic;
using MediatR;

namespace CommissioningService.Application.Commands.RunSceneTest;

public record RunSceneTestCommand(Guid SessionId, List<string> SceneIds) : IRequest<Unit>;