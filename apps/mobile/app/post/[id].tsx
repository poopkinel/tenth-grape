import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePost, useComments, useAddComment, useReact, useUnreact } from '@/hooks/use-posts';

const REACTION_EMOJIS = ['👍', '❤️', '🎲', '☕', '😂', '🎉'];

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isLoading } = usePost(id);
  const { data: comments } = useComments(id);
  const addComment = useAddComment();
  const react = useReact();
  const unreact = useUnreact();
  const [commentText, setCommentText] = useState('');

  if (isLoading || !post) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  function handleReact(emoji: string) {
    if (!post) return;
    const current = post.reactions.find((r) => r.mine);
    if (current?.emoji === emoji) {
      unreact.mutate(post.id);
    } else {
      react.mutate({ postId: post.id, emoji });
    }
  }

  async function handleAddComment() {
    const content = commentText.trim();
    if (!content) return;
    setCommentText('');
    await addComment.mutateAsync({ postId: id, content });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Author */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {post.author.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <Text style={styles.time}>{new Date(post.createdAt).toLocaleString()}</Text>
          </View>
        </View>

        {/* Content */}
        {post.content && <Text style={styles.body}>{post.content}</Text>}

        {/* Games */}
        {post.games.length > 0 && (
          <View style={styles.gamesList}>
            {post.games.map((g) => (
              <View key={g.bggId} style={styles.gameRow}>
                {g.thumbnail && <Image source={{ uri: g.thumbnail }} style={styles.gameThumb} />}
                <Text style={styles.gameTitle}>{g.title}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Reactions */}
        <View style={styles.reactionsRow}>
          {REACTION_EMOJIS.map((emoji) => {
            const summary = post.reactions.find((r) => r.emoji === emoji);
            const mine = summary?.mine ?? false;
            const count = summary?.count ?? 0;
            return (
              <TouchableOpacity
                key={emoji}
                style={[styles.reactionBtn, mine && styles.reactionBtnActive]}
                onPress={() => handleReact(emoji)}
              >
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
                {count > 0 && (
                  <Text style={[styles.reactionCount, mine && styles.reactionCountActive]}>
                    {count}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Comments */}
        <Text style={styles.sectionTitle}>
          Comments ({comments?.length ?? 0})
        </Text>
        {(comments ?? []).map((c) => (
          <View key={c.id} style={styles.comment}>
            <View style={styles.commentAvatar}>
              <Text style={styles.commentAvatarText}>
                {c.author.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.commentAuthor}>{c.author.name}</Text>
              <Text style={styles.commentBody}>{c.content}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Add a comment..."
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
          onPress={handleAddComment}
          disabled={!commentText.trim()}
        >
          <Text style={styles.sendBtnText}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  authorName: { fontSize: 16, fontWeight: '700' },
  time: { fontSize: 12, color: '#9ca3af', marginTop: 1 },

  body: { fontSize: 16, lineHeight: 23, color: '#111', marginBottom: 16 },

  gamesList: { gap: 8, marginBottom: 16 },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  gameThumb: { width: 40, height: 40, borderRadius: 6 },
  gameTitle: { fontSize: 14, fontWeight: '600' },

  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  reactionBtnActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#2563EB' },
  reactionCount: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  reactionCountActive: { color: '#2563EB' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  comment: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#9ca3af', justifyContent: 'center', alignItems: 'center' },
  commentAvatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  commentAuthor: { fontSize: 13, fontWeight: '700' },
  commentBody: { fontSize: 14, color: '#374151', marginTop: 2 },

  inputBar: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14 },
  sendBtn: { backgroundColor: '#2563EB', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontWeight: '700' },
});
