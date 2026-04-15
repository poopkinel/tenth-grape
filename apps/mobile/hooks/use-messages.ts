import { useInfiniteQuery } from '@tanstack/react-query';
import { authedApi } from '@/lib/api';
import type { MessageDto } from '@meeple/shared';

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const url = pageParam
        ? `/messages/${conversationId}?cursor=${pageParam}`
        : `/messages/${conversationId}`;
      return authedApi.get<MessageDto[]>(url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 30) return undefined;
      return lastPage[lastPage.length - 1]?.id;
    },
  });
}
