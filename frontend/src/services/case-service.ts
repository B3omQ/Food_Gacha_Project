import { apiClient } from '@/lib/api-client';
import { CaseDetail, CaseSummary, CreateOrUpdateCaseDto, OpenCaseRequest, OpenCaseResult } from '@/types/case';

export const caseService = {
  async getActiveCases(): Promise<CaseSummary[]> {
    return apiClient<CaseSummary[]>('api/cases?includeInactive=false');
  },

  async getAllCases(): Promise<CaseSummary[]> {
    return apiClient<CaseSummary[]>('api/cases?includeInactive=true');
  },

  async getCaseById(caseId: number): Promise<CaseDetail> {
    return apiClient<CaseDetail>(`api/cases/${caseId}`);
  },

  async createCase(data: CreateOrUpdateCaseDto): Promise<CaseSummary> {
    return apiClient<CaseSummary>('api/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCase(caseId: number, data: CreateOrUpdateCaseDto): Promise<void> {
    return apiClient<void>(`api/cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCase(caseId: number): Promise<void> {
    return apiClient<void>(`api/cases/${caseId}`, {
      method: 'DELETE',
    });
  },

  async batchDeleteCases(ids: number[]): Promise<{ message: string; deletedCount: number }> {
    return apiClient<{ message: string; deletedCount: number }>('api/cases/batch-delete', {
      method: 'POST',
      body: JSON.stringify(ids),
    });
  },

  async toggleCaseStatus(caseId: number): Promise<{ id: number; isActive: boolean }> {
    return apiClient<{ id: number; isActive: boolean }>(`api/cases/${caseId}/toggle-status`, {
      method: 'PATCH',
    });
  },

  async openCase(caseId: number, request?: OpenCaseRequest): Promise<OpenCaseResult> {
    return apiClient<OpenCaseResult>(`api/cases/${caseId}/open`, {
      method: 'POST',
      body: request ? JSON.stringify(request) : undefined,
    });
  },

  async openMultipleCases(caseId: number, count: number = 3, request?: OpenCaseRequest): Promise<OpenCaseResult[]> {
    return apiClient<OpenCaseResult[]>(`api/cases/${caseId}/open-multiple?count=${count}`, {
      method: 'POST',
      body: request ? JSON.stringify(request) : undefined,
    });
  },
};
