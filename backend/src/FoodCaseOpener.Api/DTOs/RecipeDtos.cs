namespace FoodCaseOpener.Api.DTOs;

public class RecipeSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int CookingTimeMinutes { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string Difficulty { get; set; } = string.Empty;
}

public class RecipeDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int CookingTimeMinutes { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public List<RecipeIngredientDto> Ingredients { get; set; } = new();
}

public class RecipeIngredientDto
{
    public int IngredientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
}
