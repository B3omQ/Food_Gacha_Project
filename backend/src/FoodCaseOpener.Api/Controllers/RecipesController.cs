using FoodCaseOpener.Api.Data;
using FoodCaseOpener.Api.DTOs;
using FoodCaseOpener.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodCaseOpener.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipesController : ControllerBase
{
    private readonly AppDbContext _context;

    public RecipesController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách tất cả các món ăn
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecipeSummaryDto>>> GetAllRecipes()
    {
        var recipes = await _context.Recipes
            .OrderByDescending(r => r.Id)
            .Select(r => new RecipeSummaryDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                ImageUrl = r.ImageUrl,
                CookingTimeMinutes = r.CookingTimeMinutes,
                EstimatedCost = r.EstimatedCost,
                Difficulty = r.Difficulty
            })
            .ToListAsync();

        return Ok(recipes);
    }

    /// <summary>
    /// Lấy danh sách nguyên liệu hiện có
    /// </summary>
    [HttpGet("ingredients")]
    public async Task<ActionResult<IEnumerable<Ingredient>>> GetAllIngredients()
    {
        var ingredients = await _context.Ingredients
            .OrderBy(i => i.Name)
            .ToListAsync();

        return Ok(ingredients);
    }

    /// <summary>
    /// Lấy thông tin chi tiết món ăn kèm nguyên liệu và hướng dẫn nấu
    /// </summary>
    [HttpGet("{recipeId:int}")]
    public async Task<ActionResult<RecipeDetailDto>> GetRecipeById(int recipeId)
    {
        var recipe = await _context.Recipes
            .Include(r => r.RecipeIngredients)
                .ThenInclude(ri => ri.Ingredient)
            .FirstOrDefaultAsync(r => r.Id == recipeId);

        if (recipe == null)
        {
            return NotFound(new { message = $"Không tìm thấy món ăn với ID {recipeId}." });
        }

        var detail = new RecipeDetailDto
        {
            Id = recipe.Id,
            Name = recipe.Name,
            Description = recipe.Description,
            ImageUrl = recipe.ImageUrl,
            CookingTimeMinutes = recipe.CookingTimeMinutes,
            EstimatedCost = recipe.EstimatedCost,
            Difficulty = recipe.Difficulty,
            Instructions = recipe.Instructions,
            Ingredients = recipe.RecipeIngredients
                .Where(ri => ri.Ingredient != null)
                .Select(ri => new RecipeIngredientDto
                {
                    IngredientId = ri.Ingredient.Id,
                    Name = ri.Ingredient.Name,
                    Quantity = ri.Quantity,
                    Unit = ri.Ingredient.Unit
                })
                .ToList()
        };

        return Ok(detail);
    }

    /// <summary>
    /// Tạo món ăn mới kèm nguyên liệu
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<RecipeDetailDto>> CreateRecipe([FromBody] CreateOrUpdateRecipeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "Tên món ăn không được để trống." });
        }

        var recipe = new Recipe
        {
            Name = dto.Name.Trim(),
            Description = dto.Description.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            CookingTimeMinutes = Math.Max(1, dto.CookingTimeMinutes),
            EstimatedCost = dto.EstimatedCost,
            Difficulty = string.IsNullOrWhiteSpace(dto.Difficulty) ? "Medium" : dto.Difficulty,
            Instructions = dto.Instructions.Trim()
        };

        await SyncIngredientsAsync(recipe, dto.Ingredients);

        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRecipeById), new { recipeId = recipe.Id }, new RecipeSummaryDto
        {
            Id = recipe.Id,
            Name = recipe.Name,
            Description = recipe.Description,
            ImageUrl = recipe.ImageUrl,
            CookingTimeMinutes = recipe.CookingTimeMinutes,
            EstimatedCost = recipe.EstimatedCost,
            Difficulty = recipe.Difficulty
        });
    }

    /// <summary>
    /// Cập nhật món ăn
    /// </summary>
    [HttpPut("{recipeId:int}")]
    public async Task<ActionResult> UpdateRecipe(int recipeId, [FromBody] CreateOrUpdateRecipeDto dto)
    {
        var recipe = await _context.Recipes
            .Include(r => r.RecipeIngredients)
            .FirstOrDefaultAsync(r => r.Id == recipeId);

        if (recipe == null)
        {
            return NotFound(new { message = $"Không tìm thấy món ăn với ID {recipeId}." });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "Tên món ăn không được để trống." });
        }

        recipe.Name = dto.Name.Trim();
        recipe.Description = dto.Description.Trim();
        recipe.ImageUrl = dto.ImageUrl?.Trim();
        recipe.CookingTimeMinutes = Math.Max(1, dto.CookingTimeMinutes);
        recipe.EstimatedCost = dto.EstimatedCost;
        recipe.Difficulty = string.IsNullOrWhiteSpace(dto.Difficulty) ? "Medium" : dto.Difficulty;
        recipe.Instructions = dto.Instructions.Trim();

        recipe.RecipeIngredients.Clear();
        await SyncIngredientsAsync(recipe, dto.Ingredients);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Xóa món ăn
    /// </summary>
    [HttpDelete("{recipeId:int}")]
    public async Task<ActionResult> DeleteRecipe(int recipeId)
    {
        var recipe = await _context.Recipes
            .Include(r => r.RecipeIngredients)
            .Include(r => r.CaseRecipes)
            .FirstOrDefaultAsync(r => r.Id == recipeId);

        if (recipe == null)
        {
            return NotFound(new { message = $"Không tìm thấy món ăn với ID {recipeId}." });
        }

        _context.Recipes.Remove(recipe);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task SyncIngredientsAsync(Recipe recipe, List<RecipeIngredientInputDto>? inputs)
    {
        if (inputs == null || inputs.Count == 0) return;

        foreach (var item in inputs)
        {
            if (string.IsNullOrWhiteSpace(item.Name)) continue;

            var trimmedName = item.Name.Trim();
            var trimmedUnit = string.IsNullOrWhiteSpace(item.Unit) ? "phần" : item.Unit.Trim();

            // Tìm hoặc tạo mới Ingredient
            var ingredient = await _context.Ingredients
                .FirstOrDefaultAsync(i => i.Name.ToLower() == trimmedName.ToLower());

            if (ingredient == null)
            {
                ingredient = new Ingredient
                {
                    Name = trimmedName,
                    Unit = trimmedUnit
                };
                _context.Ingredients.Add(ingredient);
                await _context.SaveChangesAsync();
            }

            recipe.RecipeIngredients.Add(new RecipeIngredient
            {
                RecipeId = recipe.Id,
                IngredientId = ingredient.Id,
                Quantity = Math.Max(0.1m, item.Quantity)
            });
        }
    }
}
