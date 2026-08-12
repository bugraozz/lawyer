import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Case, CreateCaseRequest, UpdateCaseStatusRequest } from '../types';

export const useCases = () => {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async (): Promise<Case[]> => {
      const response = await apiClient.get('/cases');
      return response.data;
    },
  });
};

export const useCase = (id: number) => {
  return useQuery({
    queryKey: ['cases', id],
    queryFn: async (): Promise<Case> => {
      const response = await apiClient.get(`/cases/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCaseRequest) => {
      const response = await apiClient.post('/cases', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
};

export const useUpdateCaseStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCaseStatusRequest }) => {
      const response = await apiClient.put(`/cases/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['cases', variables.id] });
    },
  });
};
