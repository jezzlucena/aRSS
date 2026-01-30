import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Category, CategoryWithChildren, CreateCategoryRequest, UpdateCategoryRequest } from '@arss/types';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: CategoryWithChildren[] }>('/categories');
      return response.data.data;
    },
  });
}

/**
 * Helper to flatten a hierarchical category tree into a flat array.
 */
export function flattenCategories(categories: CategoryWithChildren[]): Category[] {
  return categories.flatMap((c) => [
    { ...c, children: undefined } as unknown as Category,
    ...flattenCategories(c.children),
  ]);
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryRequest) => {
      const response = await api.post<{ success: boolean; data: Category }>('/categories', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, ...data }: UpdateCategoryRequest & { categoryId: string }) => {
      const response = await api.patch<{ success: boolean; data: Category }>(`/categories/${categoryId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      await api.delete(`/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds() });
    },
  });
}
