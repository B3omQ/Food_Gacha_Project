using FoodCaseOpener.Api.Data;
using FoodCaseOpener.Api.DTOs;
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
}
