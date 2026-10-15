import { RecipeIngredient, RecipeSummary } from './recipe';

export interface CaseSummary {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  recipeCount: number;
}

export interface CaseRecipeItem {
  recipeId: number;
  name: string;
  imageUrl: string | null;
  cookingTimeMinutes: number;
  estimatedCost: number | null;
  difficulty: string;
  weight: number;
  ingredients?: RecipeIngredient[];
}

export interface CaseDetail {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  recipes: CaseRecipeItem[];
}

export interface CaseRecipeInput {
  recipeId: number;
  weight: number;
}

export interface CreateOrUpdateCaseDto {
  name: string;
  description: string;
  imageUrl?: string | null;
  isActive: boolean;
  recipes: CaseRecipeInput[];
}

export interface OpenCaseRequest {
  availableIngredientIds?: number[];
  availableIngredientNames?: string[];
  onlyCookableWithAvailableIngredients?: boolean;
}

export interface OpenCaseResult {
  openingId: number;
  caseId: number;
  recipe: RecipeSummary;
  availableIngredients: RecipeIngredient[];
  missingIngredients: RecipeIngredient[];
  isCookableNow: boolean;
  matchPercentage: number;
}
