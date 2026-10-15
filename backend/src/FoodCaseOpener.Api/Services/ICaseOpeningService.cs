using FoodCaseOpener.Api.DTOs;

namespace FoodCaseOpener.Api.Services;

public interface ICaseOpeningService
{
    Task<OpenCaseResultDto> OpenCaseAsync(int caseId);
}
