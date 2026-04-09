import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages } from '@/hooks/use-messages';
import { useAuthStore } from '@/store/auth.store';
import { getSocket, joinMatch, leaveMatch, sendMessage as emitMessage, markRead } from '@/lib/socket';
import type { MessageDto } from '@meeple/shared';

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(matchId);
  const { accessToken } = useAuthStore();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [localMessages, setLocalMessages] = useState<MessageDto[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Decode current user id from JWT
  const myId = accessToken ? JSON.parse(atob(accessToken.split('.')[1])).sub : null;

  // All messages: local optimistic + fetched history
  const fetchedMessages = data?.pages.flat() ?? [];
  const allMessages = [...localMessages, ...fetchedMessages];

  useEffect(() => {
    let mounted = true;

    (async () => {
      const socket = await getSocket();
      await joinMatch(matchId);
      await markRead(matchId);

      socket.on('newMessage', (msg: MessageDto) => {
        if (!mounted) return;
        // Avoid duplicates from our own sends
        if (msg.senderId === myId) return;
        setLocalMessages((prev) => [msg, ...prev]);
      });
    })();

    return () => {
      mounted = false;
      leaveMatch(matchId);
      getSocket().then((s) => s.off('newMessage'));
    };
  }, [matchId]);

  async function handleSend() {
    const content = text.trim();
    if (!content) return;
    setText('');

    // Optimistic message
    const optimistic: MessageDto = {
      id: `temp-${Date.now()}`,
      matchId,
      senderId: myId,
      content,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setLocalMessages((prev) => [optimistic, ...prev]);

    await emitMessage(matchId, content);
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={allMessages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.list}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => {
          const isMine = item.senderId === myId;
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.content}</Text>
              <Text style={[styles.time, isMine && styles.timeMine]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 10, marginBottom: 8 },
  bubbleMine: { backgroundColor: '#2563EB', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#f3f4f6', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: '#111' },
  bubbleTextMine: { color: '#fff' },
  time: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  timeMine: { color: 'rgba(255,255,255,0.7)' },
  inputBar: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', gap: 8, backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#000' },
  sendBtn: { backgroundColor: '#2563EB', borderRadius: 20, paddingHorizontal: 18, justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontWeight: '700' },
});
