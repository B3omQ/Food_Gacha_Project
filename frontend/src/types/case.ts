import { RecipeSummary } from './recipe';

export interface CaseSummary {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
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
}

export interface CaseDetail {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  recipes: CaseRecipeItem[];
}

export interface OpenCaseResult {
  openingId: number;
  caseId: number;
  recipe: RecipeSummary;
}
