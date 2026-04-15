import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authedApi } from '@/lib/api';
import type { GroupDto, GroupDetailDto, CreateGroupDto } from '@meeple/shared';

export function useMyGroups() {
  return useQuery({
    queryKey: ['my-groups'],
    queryFn: () => authedApi.get<GroupDto[]>('/groups/mine'),
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => authedApi.get<GroupDetailDto>(`/groups/${id}`),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupDto) => authedApi.post<any>('/groups', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-groups'] }),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authedApi.post<void>(`/groups/${id}/leave`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-groups'] }),
  });
}
