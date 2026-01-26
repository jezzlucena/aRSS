import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useFeedStore } from '@/stores/feedStore';
import { toast } from '@/stores/toastStore';
import type { Feed, SubscriptionWithFeed, AddFeedRequest } from '@arss/types';

export function useFeeds() {
  const { setFeeds } = useFeedStore();

  const query = useQuery({
    queryKey: ['feeds'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: SubscriptionWithFeed[] }>('/feeds');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (query.data) {
      setFeeds(query.data);
    }
  }, [query.data, setFeeds]);

  return query;
}

export function useAddFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddFeedRequest) => {
      const response = await api.post<{ success: boolean; data: SubscriptionWithFeed }>('/feeds', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success(`Added "${data.feed.title}"`);
    },
    onError: () => {
      toast.error('Failed to add feed');
    },
  });
}

export function useDiscoverFeed() {
  return useMutation({
    mutationFn: async (url: string) => {
      const response = await api.post<{ success: boolean; data: { url: string; title: string; description: string | null } }>('/feeds/discover', { url });
      return response.data.data;
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedId, ...data }: { feedId: string; categoryId?: string | null; customTitle?: string | null }) => {
      const response = await api.patch<{ success: boolean; data: SubscriptionWithFeed }>(`/feeds/${feedId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });
}

export function useDeleteFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedId: string) => {
      await api.delete(`/feeds/${feedId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Feed removed');
    },
    onError: () => {
      toast.error('Failed to remove feed');
    },
  });
}

export function useRefreshFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedId: string) => {
      const response = await api.post<{ success: boolean; data: Feed }>(`/feeds/${feedId}/refresh`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Feed refreshed');
    },
    onError: () => {
      toast.error('Failed to refresh feed');
    },
  });
}
