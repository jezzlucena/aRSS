import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useFeedStore } from '@/stores/feedStore';
import type { Category, CategoryWithChildren, CreateCategoryRequest, UpdateCategoryRequest } from '@arss/types';

export function useCategories() {
  const { setCategories } = useFeedStore();

  const query = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: CategoryWithChildren[] }>('/categories');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (query.data) {
      // Flatten for the store
      const flatten = (cats: CategoryWithChildren[]): Category[] => {
        return cats.flatMap((c) => [
          { ...c, children: undefined } as unknown as Category,
          ...flatten(c.children),
        ]);
      };
      setCategories(flatten(query.data));
    }
  }, [query.data, setCategories]);

  return query;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryRequest) => {
      const response = await api.post<{ success: boolean; data: Category }>('/categories', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });
}
