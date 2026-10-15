namespace FoodCaseOpener.Api.Models;

public class CaseRecipe
{
    public int FoodCaseId { get; set; }
    public FoodCase FoodCase { get; set; } = null!;

    public int RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;

    public int Weight { get; set; } = 1;
}
