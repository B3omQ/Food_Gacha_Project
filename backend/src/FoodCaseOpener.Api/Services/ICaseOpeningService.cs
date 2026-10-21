using FoodCaseOpener.Api.DTOs;

namespace FoodCaseOpener.Api.Services;

public interface ICaseOpeningService
{
    Task<OpenCaseResultDto> OpenCaseAsync(int caseId, OpenCaseRequestDto? request = null);
    Task<List<OpenCaseResultDto>> OpenMultipleCasesAsync(int caseId, int count, OpenCaseRequestDto? request = null);
}
