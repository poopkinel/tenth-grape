import { useInfiniteQuery } from '@tanstack/react-query';
import { authedApi } from '@/lib/api';
import type { PostDto } from '@meeple/shared';

interface FeedPage {
  items: PostDto[];
  nextCursor: string | null;
}

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }: { pageParam?: string }) => {
      const qs = pageParam ? `?cursor=${pageParam}` : '';
      return authedApi.get<FeedPage>(`/feed${qs}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
