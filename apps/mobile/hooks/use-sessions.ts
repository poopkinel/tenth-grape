import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authedApi } from '@/lib/api';

export function useMySessions() {
  return useQuery({
    queryKey: ['my-sessions'],
    queryFn: () => authedApi.get<any[]>('/sessions/mine'),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => authedApi.get<any>(`/sessions/${id}`),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => authedApi.post<any>('/sessions', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-sessions'] }),
  });
}

export function useRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      authedApi.patch<any>(`/sessions/${id}/rsvp`, { status }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['session', id] });
      qc.invalidateQueries({ queryKey: ['my-sessions'] });
    },
  });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [k: string]: any }) =>
      authedApi.post<any>(`/sessions/${id}/complete`, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['session', id] });
      qc.invalidateQueries({ queryKey: ['my-sessions'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useCancelSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authedApi.delete<void>(`/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-sessions'] }),
  });
}
