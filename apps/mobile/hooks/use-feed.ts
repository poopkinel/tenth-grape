import { useInfiniteQuery } from '@tanstack/react-query';
import { authedApi } from '@/lib/api';
import type { PostDto, EventDto } from '@meeple/shared';

export interface OpenInvitation {
  id: string;
  title: string;
  scheduledAt: string;
  locationText: string;
  host: { id: string; name: string; avatar: string | null } | null;
  games: { bggId: number; title: string; thumbnail: string | null }[];
  accepted: number;
  maxPlayers: number;
}

export interface FeedEmptyState {
  events: EventDto[];
  openInvitations: OpenInvitation[];
  marketplaceComingSoon: boolean;
}

export interface FeedPage {
  items: PostDto[];
  nextCursor: string | null;
  emptyState: FeedEmptyState | null;
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
