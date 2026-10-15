using FoodCaseOpener.Api.Data;
using FoodCaseOpener.Api.DTOs;
using FoodCaseOpener.Api.Models;
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

    public async Task<OpenCaseResultDto> OpenCaseAsync(int caseId, OpenCaseRequestDto? request = null)
    {
        var foodCase = await _context.FoodCases
            .Include(fc => fc.CaseRecipes)
                .ThenInclude(cr => cr.Recipe)
                    .ThenInclude(r => r.RecipeIngredients)
                        .ThenInclude(ri => ri.Ingredient)
            .FirstOrDefaultAsync(fc => fc.Id == caseId);

        if (foodCase == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hòm với ID {caseId}.");
        }

        if (!foodCase.IsActive)
        {
            throw new InvalidOperationException($"Hòm '{foodCase.Name}' hiện đang tạm khóa hoặc không hoạt động.");
        }

        var candidateRecipes = foodCase.CaseRecipes
            .Where(cr => cr.Recipe != null && cr.Weight > 0)
            .ToList();

        if (candidateRecipes.Count == 0)
        {
            throw new InvalidOperationException($"Hòm '{foodCase.Name}' chưa có món ăn hợp lệ để mở.");
        }

        // Tủ lạnh người dùng
        var userIds = request?.AvailableIngredientIds?.ToHashSet() ?? new HashSet<int>();
        var userNames = request?.AvailableIngredientNames?
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim().ToLower())
            .ToHashSet() ?? new HashSet<string>();

        // Kiểm tra nguyên liệu của từng món
        bool HasAllIngredients(Recipe r)
        {
            var reqIngredients = r.RecipeIngredients.ToList();
            if (reqIngredients.Count == 0) return true;

            return reqIngredients.All(ri =>
                userIds.Contains(ri.IngredientId) ||
                (ri.Ingredient != null && userNames.Contains(ri.Ingredient.Name.Trim().ToLower())));
        }

        List<CaseRecipe> pool = candidateRecipes;

        // Nếu người dùng chọn chế độ: Chỉ quay món có thể nấu từ tủ lạnh
        if (request != null && request.OnlyCookableWithAvailableIngredients)
        {
            pool = candidateRecipes.Where(cr => HasAllIngredients(cr.Recipe)).ToList();
            if (pool.Count == 0)
            {
                throw new InvalidOperationException(
                    $"Tủ lạnh hiện tại của bạn chưa đủ nguyên liệu để nấu bất kỳ món nào trong hòm '{foodCase.Name}'. Hãy thêm đồ vào tủ lạnh hoặc chọn chế độ 'Quay tất cả món'!");
            }
        }

        // Weighted Random Selection
        var totalWeight = pool.Sum(cr => cr.Weight);
        var roll = Random.Shared.Next(0, totalWeight);

        var currentSum = 0;
        var selectedCaseRecipe = pool.First();

        foreach (var item in pool)
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

        // Tính toán các nguyên liệu đã có và còn thiếu đối với món đã trúng
        var recipeIngredients = recipe.RecipeIngredients.ToList();
        var availableList = new List<RecipeIngredientDto>();
        var missingList = new List<RecipeIngredientDto>();

        foreach (var ri in recipeIngredients)
        {
            var isAvailable = userIds.Contains(ri.IngredientId) ||
                (ri.Ingredient != null && userNames.Contains(ri.Ingredient.Name.Trim().ToLower()));

            var itemDto = new RecipeIngredientDto
            {
                IngredientId = ri.IngredientId,
                Name = ri.Ingredient?.Name ?? "Nguyên liệu",
                Quantity = ri.Quantity,
                Unit = ri.Ingredient?.Unit ?? "phần"
            };

            if (isAvailable)
            {
                availableList.Add(itemDto);
            }
            else
            {
                missingList.Add(itemDto);
            }
        }

        var isCookable = recipeIngredients.Count == 0 || missingList.Count == 0;
        var matchPercentage = recipeIngredients.Count > 0
            ? Math.Round((double)availableList.Count / recipeIngredients.Count * 100, 1)
            : 100.0;

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
            },
            AvailableIngredients = availableList,
            MissingIngredients = missingList,
            IsCookableNow = isCookable,
            MatchPercentage = matchPercentage
        };
    }
}
