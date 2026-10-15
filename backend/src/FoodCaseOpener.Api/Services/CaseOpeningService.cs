using FoodCaseOpener.Api.Data;
using FoodCaseOpener.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FoodCaseOpener.Api.Services;

public class CaseOpeningService : ICaseOpeningService
{
    private readonly AppDbContext _context;
    private static int _openingCounter = 1;

    public CaseOpeningService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<OpenCaseResultDto> OpenCaseAsync(int caseId)
    {
        var foodCase = await _context.FoodCases
            .Include(fc => fc.CaseRecipes)
                .ThenInclude(cr => cr.Recipe)
            .FirstOrDefaultAsync(fc => fc.Id == caseId);

        if (foodCase == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hòm với ID {caseId}.");
        }

        if (!foodCase.IsActive)
        {
            throw new InvalidOperationException($"Hòm '{foodCase.Name}' hiện đang tạm khóa hoặc không hoạt động.");
        }

        var validRecipes = foodCase.CaseRecipes
            .Where(cr => cr.Recipe != null && cr.Weight > 0)
            .ToList();

        if (validRecipes.Count == 0)
        {
            throw new InvalidOperationException($"Hòm '{foodCase.Name}' chưa có món ăn hợp lệ để mở.");
        }

        // Weighted Random Selection
        var totalWeight = validRecipes.Sum(cr => cr.Weight);
        var roll = Random.Shared.Next(0, totalWeight);

        var currentSum = 0;
        var selectedCaseRecipe = validRecipes.First();

        foreach (var item in validRecipes)
        {
            currentSum += item.Weight;
            if (roll < currentSum)
            {
                selectedCaseRecipe = item;
                break;
            }
        }

        var recipe = selectedCaseRecipe.Recipe;
        var openingId = Interlocked.Increment(ref _openingCounter);

        return new OpenCaseResultDto
        {
            OpeningId = openingId,
            CaseId = foodCase.Id,
            Recipe = new RecipeSummaryDto
            {
                Id = recipe.Id,
                Name = recipe.Name,
                Description = recipe.Description,
                ImageUrl = recipe.ImageUrl,
                CookingTimeMinutes = recipe.CookingTimeMinutes,
                EstimatedCost = recipe.EstimatedCost,
                Difficulty = recipe.Difficulty
            }
        };
    }
}
