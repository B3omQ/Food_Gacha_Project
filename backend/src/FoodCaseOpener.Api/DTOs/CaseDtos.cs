namespace FoodCaseOpener.Api.DTOs;

public class CaseSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public int RecipeCount { get; set; }
}

public class CaseDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public List<CaseRecipeItemDto> Recipes { get; set; } = new();
}

public class CaseRecipeItemDto
{
    public int RecipeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int CookingTimeMinutes { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public int Weight { get; set; }
    public List<RecipeIngredientDto> Ingredients { get; set; } = new();
}

public class CreateOrUpdateCaseDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public List<CaseRecipeInputDto> Recipes { get; set; } = new();
}

public class CaseRecipeInputDto
{
    public int RecipeId { get; set; }
    public int Weight { get; set; } = 1;
}

public class OpenCaseRequestDto
{
    public List<int>? AvailableIngredientIds { get; set; }
    public List<string>? AvailableIngredientNames { get; set; }
    public bool OnlyCookableWithAvailableIngredients { get; set; }
}

public class OpenCaseResultDto
{
    public int OpeningId { get; set; }
    public int CaseId { get; set; }
    public RecipeSummaryDto Recipe { get; set; } = null!;
    
    // Tủ lạnh & so sánh nguyên liệu
    public List<RecipeIngredientDto> AvailableIngredients { get; set; } = new();
    public List<RecipeIngredientDto> MissingIngredients { get; set; } = new();
    public bool IsCookableNow { get; set; }
    public double MatchPercentage { get; set; }
}
