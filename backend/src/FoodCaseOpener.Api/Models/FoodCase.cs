namespace FoodCaseOpener.Api.Models;

public class FoodCase
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<CaseRecipe> CaseRecipes { get; set; } = new List<CaseRecipe>();
}
