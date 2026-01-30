import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import type { UserPreferences } from '@arss/types';

export function usePreferences() {
  const { setTheme, setLayout, setArticleView, setAccentColor, setArticleWidth } = useUIStore();

  const query = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: UserPreferences }>('/preferences');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (query.data) {
      setTheme(query.data.theme as 'light' | 'dark' | 'system');
      setLayout(query.data.layout as 'compact' | 'list' | 'cards' | 'magazine');
      setArticleView(query.data.articleView as 'split-horizontal' | 'split-vertical' | 'overlay' | 'full');
      setAccentColor(query.data.accentColor);
      if (query.data.articleWidth) {
        setArticleWidth(query.data.articleWidth as 'narrow' | 'wide' | 'full');
      }
    }
  }, [query.data, setTheme, setLayout, setArticleView, setAccentColor, setArticleWidth]);

  return query;
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Pick<UserPreferences, 'theme' | 'layout' | 'articleView' | 'accentColor' | 'fontSize' | 'articleWidth'>>) => {
      const response = await api.patch<{ success: boolean; data: UserPreferences }>('/preferences', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}

interface OPMLImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export function useImportOPML() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opmlContent: string) => {
      const response = await api.post<{ success: boolean; data: OPMLImportResult }>(
        '/preferences/import',
        { opml: opmlContent }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useExportOPML() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/preferences/export', {
        responseType: 'blob',
      });
      return response.data;
    },
  });
}
