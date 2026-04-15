import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authedApi } from '@/lib/api';
import type { PostDto, CommentDto, CreatePostDto, CreateCommentDto } from '@meeple/shared';

export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => authedApi.get<PostDto>(`/posts/${id}`),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostDto) => authedApi.post<PostDto>('/posts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authedApi.delete<void>(`/posts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useReact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) =>
      authedApi.post<any>(`/posts/${postId}/reactions`, { emoji }),
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ['post', postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUnreact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => authedApi.delete<void>(`/posts/${postId}/reactions`),
    onSuccess: (_, postId) => {
      qc.invalidateQueries({ queryKey: ['post', postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => authedApi.get<CommentDto[]>(`/posts/${postId}/comments`),
    enabled: !!postId,
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, ...body }: { postId: string } & CreateCommentDto) =>
      authedApi.post<CommentDto>(`/posts/${postId}/comments`, body),
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}
