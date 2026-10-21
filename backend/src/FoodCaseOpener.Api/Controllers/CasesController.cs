using FoodCaseOpener.Api.Data;
using FoodCaseOpener.Api.DTOs;
using FoodCaseOpener.Api.Models;
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
    /// Lấy danh sách các hòm (mặc định chỉ lấy hòm đang hoạt động, admin có thể lấy tất cả)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CaseSummaryDto>>> GetCases([FromQuery] bool includeInactive = false)
    {
        var query = _context.FoodCases.AsQueryable();
        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        var cases = await query
            .OrderByDescending(c => c.Id)
            .Select(c => new CaseSummaryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                IsActive = c.IsActive,
                RecipeCount = c.CaseRecipes.Count
            })
            .ToListAsync();

        return Ok(cases);
    }

    /// <summary>
    /// Lấy thông tin chi tiết một hòm và danh sách món ăn bên trong (kèm nguyên liệu từng món)
    /// </summary>
    [HttpGet("{caseId:int}")]
    public async Task<ActionResult<CaseDetailDto>> GetCaseById(int caseId)
    {
        var foodCase = await _context.FoodCases
            .Include(c => c.CaseRecipes)
                .ThenInclude(cr => cr.Recipe)
                    .ThenInclude(r => r.RecipeIngredients)
                        .ThenInclude(ri => ri.Ingredient)
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
            IsActive = foodCase.IsActive,
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
                    Weight = cr.Weight,
                    Ingredients = cr.Recipe.RecipeIngredients
                        .Where(ri => ri.Ingredient != null)
                        .Select(ri => new RecipeIngredientDto
                        {
                            IngredientId = ri.Ingredient.Id,
                            Name = ri.Ingredient.Name,
                            Quantity = ri.Quantity,
                            Unit = ri.Ingredient.Unit
                        })
                        .ToList()
                })
                .ToList()
        };

        return Ok(detail);
    }

    /// <summary>
    /// Tạo hòm mới kèm danh sách món ăn và trọng số
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CaseDetailDto>> CreateCase([FromBody] CreateOrUpdateCaseDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "Tên hòm không được để trống." });
        }

        var newCase = new FoodCase
        {
            Name = dto.Name.Trim(),
            Description = dto.Description.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            IsActive = dto.IsActive
        };

        if (dto.Recipes != null && dto.Recipes.Count > 0)
        {
            var validRecipeIds = await _context.Recipes
                .Where(r => dto.Recipes.Select(x => x.RecipeId).Contains(r.Id))
                .Select(r => r.Id)
                .ToListAsync();

            foreach (var r in dto.Recipes)
            {
                if (validRecipeIds.Contains(r.RecipeId))
                {
                    newCase.CaseRecipes.Add(new CaseRecipe
                    {
                        RecipeId = r.RecipeId,
                        Weight = Math.Max(1, r.Weight)
                    });
                }
            }
        }

        _context.FoodCases.Add(newCase);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCaseById), new { caseId = newCase.Id }, new CaseSummaryDto
        {
            Id = newCase.Id,
            Name = newCase.Name,
            Description = newCase.Description,
            ImageUrl = newCase.ImageUrl,
            IsActive = newCase.IsActive,
            RecipeCount = newCase.CaseRecipes.Count
        });
    }

    /// <summary>
    /// Cập nhật thông tin hòm và danh sách món ăn
    /// </summary>
    [HttpPut("{caseId:int}")]
    public async Task<ActionResult> UpdateCase(int caseId, [FromBody] CreateOrUpdateCaseDto dto)
    {
        var foodCase = await _context.FoodCases
            .Include(c => c.CaseRecipes)
            .FirstOrDefaultAsync(c => c.Id == caseId);

        if (foodCase == null)
        {
            return NotFound(new { message = $"Không tìm thấy hòm với ID {caseId}." });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "Tên hòm không được để trống." });
        }

        foodCase.Name = dto.Name.Trim();
        foodCase.Description = dto.Description.Trim();
        foodCase.ImageUrl = dto.ImageUrl?.Trim();
        foodCase.IsActive = dto.IsActive;

        foodCase.CaseRecipes.Clear();
        if (dto.Recipes != null && dto.Recipes.Count > 0)
        {
            var validRecipeIds = await _context.Recipes
                .Where(r => dto.Recipes.Select(x => x.RecipeId).Contains(r.Id))
                .Select(r => r.Id)
                .ToListAsync();

            foreach (var r in dto.Recipes)
            {
                if (validRecipeIds.Contains(r.RecipeId))
                {
                    foodCase.CaseRecipes.Add(new CaseRecipe
                    {
                        FoodCaseId = foodCase.Id,
                        RecipeId = r.RecipeId,
                        Weight = Math.Max(1, r.Weight)
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Xóa hòm
    /// </summary>
    [HttpDelete("{caseId:int}")]
    public async Task<ActionResult> DeleteCase(int caseId)
    {
        var foodCase = await _context.FoodCases
            .Include(c => c.CaseRecipes)
            .FirstOrDefaultAsync(c => c.Id == caseId);

        if (foodCase == null)
        {
            return NotFound(new { message = $"Không tìm thấy hòm với ID {caseId}." });
        }

        _context.FoodCases.Remove(foodCase);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Bật / Tắt trạng thái hoạt động của hòm
    /// </summary>
    [HttpPatch("{caseId:int}/toggle-status")]
    public async Task<ActionResult> ToggleCaseStatus(int caseId)
    {
        var foodCase = await _context.FoodCases.FindAsync(caseId);
        if (foodCase == null)
        {
            return NotFound(new { message = $"Không tìm thấy hòm với ID {caseId}." });
        }

        foodCase.IsActive = !foodCase.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { id = foodCase.Id, isActive = foodCase.IsActive });
    }

    /// <summary>
    /// Mở hòm và nhận món ăn được chọn theo trọng số (hỗ trợ kiểm tra tủ lạnh)
    /// </summary>
    [HttpPost("{caseId:int}/open")]
    public async Task<ActionResult<OpenCaseResultDto>> OpenCase(int caseId, [FromBody] OpenCaseRequestDto? request = null)
    {
        try
        {
            var result = await _caseOpeningService.OpenCaseAsync(caseId, request);
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

    /// <summary>
    /// Mở nhiều hòm cùng lúc (ví dụ: mở 3 hòm)
    /// </summary>
    [HttpPost("{caseId:int}/open-multiple")]
    public async Task<ActionResult<List<OpenCaseResultDto>>> OpenMultipleCases(
        int caseId,
        [FromQuery] int count = 3,
        [FromBody] OpenCaseRequestDto? request = null)
    {
        try
        {
            count = Math.Clamp(count, 1, 10);
            var results = await _caseOpeningService.OpenMultipleCasesAsync(caseId, count, request);
            return Ok(results);
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
            _logger.LogError(ex, "Lỗi xảy ra khi mở nhiều hòm {CaseId}", caseId);
            return StatusCode(500, new { message = "Đã xảy ra lỗi không mong muốn trên máy chủ." });
        }
    }
}
