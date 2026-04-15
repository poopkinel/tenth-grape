import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authedApi } from '@/lib/api';
import type { EventDto, EventDetailDto, CreateEventDto, EventAttendeeStatus } from '@meeple/shared';

export function useMyEvents() {
  return useQuery({
    queryKey: ['my-events'],
    queryFn: () => authedApi.get<EventDto[]>('/events/mine'),
  });
}

export function useNearbyEvents(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['nearby-events', lat, lng],
    queryFn: () => authedApi.get<EventDto[]>(`/events/nearby?lat=${lat}&lng=${lng}`),
    enabled: lat !== null && lng !== null,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => authedApi.get<EventDetailDto>(`/events/${id}`),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventDto) => authedApi.post<any>('/events', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-events'] });
      qc.invalidateQueries({ queryKey: ['nearby-events'] });
    },
  });
}

export function useRsvpEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventAttendeeStatus }) =>
      authedApi.patch<any>(`/events/${id}/rsvp`, { status }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['my-events'] });
      qc.invalidateQueries({ queryKey: ['nearby-events'] });
    },
  });
}

export function useCancelEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authedApi.delete<void>(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-events'] });
      qc.invalidateQueries({ queryKey: ['nearby-events'] });
    },
  });
}
