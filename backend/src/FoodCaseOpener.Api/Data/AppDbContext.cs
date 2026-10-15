using Microsoft.EntityFrameworkCore;
using FoodCaseOpener.Api.Models;

namespace FoodCaseOpener.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<FoodCase> FoodCases => Set<FoodCase>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<CaseRecipe> CaseRecipes => Set<CaseRecipe>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Composite key for RecipeIngredient
        modelBuilder.Entity<RecipeIngredient>()
            .HasKey(ri => new { ri.RecipeId, ri.IngredientId });

        modelBuilder.Entity<RecipeIngredient>()
            .HasOne(ri => ri.Recipe)
            .WithMany(r => r.RecipeIngredients)
            .HasForeignKey(ri => ri.RecipeId);

        modelBuilder.Entity<RecipeIngredient>()
            .HasOne(ri => ri.Ingredient)
            .WithMany(i => i.RecipeIngredients)
            .HasForeignKey(ri => ri.IngredientId);

        modelBuilder.Entity<RecipeIngredient>()
            .Property(ri => ri.Quantity)
            .HasPrecision(18, 2);

        // Composite key for CaseRecipe
        modelBuilder.Entity<CaseRecipe>()
            .HasKey(cr => new { cr.FoodCaseId, cr.RecipeId });

        modelBuilder.Entity<CaseRecipe>()
            .HasOne(cr => cr.FoodCase)
            .WithMany(fc => fc.CaseRecipes)
            .HasForeignKey(cr => cr.FoodCaseId);

        modelBuilder.Entity<CaseRecipe>()
            .HasOne(cr => cr.Recipe)
            .WithMany(r => r.CaseRecipes)
            .HasForeignKey(cr => cr.RecipeId);

        modelBuilder.Entity<Recipe>()
            .Property(r => r.EstimatedCost)
            .HasPrecision(18, 2);
    }
}
