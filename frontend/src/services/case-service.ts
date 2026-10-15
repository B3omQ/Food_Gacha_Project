import { apiClient } from '@/lib/api-client';
import { CaseDetail, CaseSummary, OpenCaseResult } from '@/types/case';

export const caseService = {
  async getActiveCases(): Promise<CaseSummary[]> {
    return apiClient<CaseSummary[]>('api/cases');
  },

  async getCaseById(caseId: number): Promise<CaseDetail> {
    return apiClient<CaseDetail>(`api/cases/${caseId}`);
  },

  async openCase(caseId: number): Promise<OpenCaseResult> {
    return apiClient<OpenCaseResult>(`api/cases/${caseId}/open`, {
      method: 'POST',
    });
  },
};
