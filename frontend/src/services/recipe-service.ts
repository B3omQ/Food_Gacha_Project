import { apiClient } from '@/lib/api-client';
import { CreateOrUpdateRecipeDto, RecipeDetail, RecipeSummary } from '@/types/recipe';

export interface IngredientOption {
  id: number;
  name: string;
  unit: string;
}

export interface BatchImportResult {
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  failedCount: number;
  messages: string[];
}

export const recipeService = {
  async getAllRecipes(): Promise<RecipeSummary[]> {
    return apiClient<RecipeSummary[]>('api/recipes');
  },

  async getRecipeById(recipeId: number): Promise<RecipeDetail> {
    return apiClient<RecipeDetail>(`api/recipes/${recipeId}`);
  },

  async createRecipe(data: CreateOrUpdateRecipeDto): Promise<RecipeSummary> {
    return apiClient<RecipeSummary>('api/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRecipe(recipeId: number, data: CreateOrUpdateRecipeDto): Promise<void> {
    return apiClient<void>(`api/recipes/${recipeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteRecipe(recipeId: number): Promise<void> {
    return apiClient<void>(`api/recipes/${recipeId}`, {
      method: 'DELETE',
    });
  },

  async getAllIngredients(): Promise<IngredientOption[]> {
    return apiClient<IngredientOption[]>('api/recipes/ingredients');
  },

  async batchImportRecipes(recipes: CreateOrUpdateRecipeDto[]): Promise<BatchImportResult> {
    return apiClient<BatchImportResult>('api/recipes/batch', {
      method: 'POST',
      body: JSON.stringify(recipes),
    });
  },
};

