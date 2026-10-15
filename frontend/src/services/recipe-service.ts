import { apiClient } from '@/lib/api-client';
import { RecipeDetail, RecipeSummary } from '@/types/recipe';

export const recipeService = {
  async getAllRecipes(): Promise<RecipeSummary[]> {
    return apiClient<RecipeSummary[]>('api/recipes');
  },

  async getRecipeById(recipeId: number): Promise<RecipeDetail> {
    return apiClient<RecipeDetail>(`api/recipes/${recipeId}`);
  },
};
