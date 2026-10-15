export interface RecipeSummary {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  cookingTimeMinutes: number;
  estimatedCost: number | null;
  difficulty: string;
}

export interface RecipeIngredient {
  ingredientId: number;
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeDetail {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  cookingTimeMinutes: number;
  estimatedCost: number | null;
  difficulty: string;
  instructions: string;
  ingredients: RecipeIngredient[];
}
