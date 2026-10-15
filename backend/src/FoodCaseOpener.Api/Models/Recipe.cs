namespace FoodCaseOpener.Api.Models;

public class Recipe
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Instructions { get; set; } = string.Empty;
    public decimal? EstimatedCost { get; set; }
    public int CookingTimeMinutes { get; set; }
    public string Difficulty { get; set; } = "Medium";

    public ICollection<RecipeIngredient> RecipeIngredients { get; set; } = new List<RecipeIngredient>();
    public ICollection<CaseRecipe> CaseRecipes { get; set; } = new List<CaseRecipe>();
}
