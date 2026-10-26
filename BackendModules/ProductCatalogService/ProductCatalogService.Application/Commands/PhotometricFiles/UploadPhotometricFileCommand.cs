using MediatR;
using ProductCatalogService.Domain.Enums;

namespace ProductCatalogService.Application.Commands.PhotometricFiles;

public sealed record UploadPhotometricFileCommand(
    Guid ProductId,
    string FileName,
    byte[] FileContent,
    PhotometricFileType FileType
) : IRequest<UploadPhotometricFileResult>;

public sealed record UploadPhotometricFileResult(
    Guid ProductId,
    Guid PhotometricFileId,
    int Version,
    int SampleCount,
    double TotalLumens,
    double PeakCandela,
    string Symmetry,
    string Url
);