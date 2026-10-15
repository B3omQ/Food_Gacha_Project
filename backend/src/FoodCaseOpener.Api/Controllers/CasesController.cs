using FoodCaseOpener.Api.Data;
using FoodCaseOpener.Api.DTOs;
using FoodCaseOpener.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodCaseOpener.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CasesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICaseOpeningService _caseOpeningService;
    private readonly ILogger<CasesController> _logger;

    public CasesController(AppDbContext context, ICaseOpeningService caseOpeningService, ILogger<CasesController> logger)
    {
        _context = context;
        _caseOpeningService = caseOpeningService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách các hòm đang hoạt động
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CaseSummaryDto>>> GetActiveCases()
    {
        var cases = await _context.FoodCases
            .Where(c => c.IsActive)
            .Select(c => new CaseSummaryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                RecipeCount = c.CaseRecipes.Count
            })
            .ToListAsync();

        return Ok(cases);
    }

    /// <summary>
    /// Lấy thông tin chi tiết một hòm và danh sách món ăn bên trong
    /// </summary>
    [HttpGet("{caseId:int}")]
    public async Task<ActionResult<CaseDetailDto>> GetCaseById(int caseId)
    {
        var foodCase = await _context.FoodCases
            .Include(c => c.CaseRecipes)
                .ThenInclude(cr => cr.Recipe)
            .FirstOrDefaultAsync(c => c.Id == caseId);

        if (foodCase == null)
        {
            return NotFound(new { message = $"Không tìm thấy hòm với ID {caseId}." });
        }

        var detail = new CaseDetailDto
        {
            Id = foodCase.Id,
            Name = foodCase.Name,
            Description = foodCase.Description,
            ImageUrl = foodCase.ImageUrl,
            Recipes = foodCase.CaseRecipes
                .Where(cr => cr.Recipe != null)
                .Select(cr => new CaseRecipeItemDto
                {
                    RecipeId = cr.Recipe.Id,
                    Name = cr.Recipe.Name,
                    ImageUrl = cr.Recipe.ImageUrl,
                    CookingTimeMinutes = cr.Recipe.CookingTimeMinutes,
                    EstimatedCost = cr.Recipe.EstimatedCost,
                    Difficulty = cr.Recipe.Difficulty,
                    Weight = cr.Weight
                })
                .ToList()
        };

        return Ok(detail);
    }

    /// <summary>
    /// Mở hòm và nhận món ăn được chọn theo trọng số
    /// </summary>
    [HttpPost("{caseId:int}/open")]
    public async Task<ActionResult<OpenCaseResultDto>> OpenCase(int caseId)
    {
        try
        {
            var result = await _caseOpeningService.OpenCaseAsync(caseId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra khi mở hòm {CaseId}", caseId);
            return StatusCode(500, new { message = "Đã xảy ra lỗi không mong muốn trên máy chủ." });
        }
    }
}
