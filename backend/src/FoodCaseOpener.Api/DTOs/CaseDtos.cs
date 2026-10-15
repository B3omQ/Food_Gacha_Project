namespace FoodCaseOpener.Api.DTOs;

public class CaseSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int RecipeCount { get; set; }
}

public class CaseDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
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
}

public class OpenCaseResultDto
{
    public int OpeningId { get; set; }
    public int CaseId { get; set; }
    public RecipeSummaryDto Recipe { get; set; } = null!;
}
