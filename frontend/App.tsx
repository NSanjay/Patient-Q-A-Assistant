import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const SAFE_FALLBACK = 'I cannot find a matching patient in your cohort, or I cannot answer this question based on the available records.';
export const INJECTION_FALLBACK_ANSWER = 'I cannot process that request.';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ table: string; field: string; value: string }>;
  confidence?: string;
  injectionDetected?: boolean;
  clarificationNeeded?: boolean;
  patient?: { id: string; name: string };
  variant?: string;
};

type Session = {
  token: string;
  cohort: 'A' | 'B';
  variant: string;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, number>>({});

  // ── Cohort Selection ────────────────────────────────────────────────────
  const selectCohort = async (cohort: 'A' | 'B') => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.post(`${API_URL}/auth/select-cohort`, { cohort });
      setSession({ token: res.data.token, cohort, variant: res.data.variant });
      setMessages([{
        id: '0',
        role: 'assistant',
        content: `Welcome! You're now accessing Group ${cohort} patient records (Prompt Variant ${res.data.variant}). Ask me about any patient by name, ID, room number, medication, or condition.`,
      }]);
    } catch {
      setError('Failed to connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ── Send Message ────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !session || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const history = messages
      .filter(m => (m.role === 'user' || m.role === 'assistant')
      &&  !m.clarificationNeeded
          && m.content !== SAFE_FALLBACK && m.content !== INJECTION_FALLBACK_ANSWER
              && !m.injectionDetected)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/chat/message`,
        { message: userMsg.content, conversationHistory: history },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.answer,
        citations: res.data.citations,
        confidence: res.data.confidence,
        injectionDetected: res.data.injectionDetected,
        clarificationNeeded: res.data.clarificationNeeded,
        patient: res.data.patient,
        variant: res.data.variant,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'An error occurred. Please try again.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ── Render Citation ─────────────────────────────────────────────────────
  const renderCitation = (c: { table: string; field: string; value: string }, i: number) => (
    <View key={i} style={styles.citation}>
      <Text style={styles.citationSource}>[{c.table} → {c.field}]</Text>
      <Text style={styles.citationValue}>{c.value}</Text>
    </View>
  );

  // ── Render Message ──────────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    // Default to showing 5 citations
    const visibleCount = expandedCitations[item.id] ?? 5;

    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>

          {/* Patient tag */}
          {item.patient && (
            <View style={styles.patientTag}>
              <Text style={styles.patientTagText}>👤 {item.patient.name}</Text>
            </View>
          )}

          {/* Injection warning */}
          {item.injectionDetected && (
            <View style={styles.warningTag}>
              <Text style={styles.warningText}>⚠️ Prompt injection detected</Text>
            </View>
          )}

          {/* Message content */}
          <Text style={[styles.messageText, isUser && styles.userText]}>
            {item.content}
          </Text>

          {/* Confidence + variant */}
          {item.confidence && (
            <View style={styles.metaRow}>
              <View style={[
                styles.confidenceBadge,
                item.confidence === 'High' ? styles.high :
                item.confidence === 'Medium' ? styles.medium : styles.low
              ]}>
                <Text style={styles.confidenceText}>{item.confidence} confidence</Text>
              </View>
              {item.variant && (
                <Text style={styles.variantText}>Variant {item.variant}</Text>
              )}
            </View>
          )}

          {/* Citations */}
          {item.citations && item.citations.length > 0 && (
            <View style={styles.citationsBlock}>
              <Text style={styles.citationsHeader}>Sources</Text>

              {item.citations
                .slice(0, visibleCount)
                .map(renderCitation)}

              {/* Show MORE button */}
              {visibleCount < item.citations.length && (
                <TouchableOpacity
                  onPress={() =>
                    setExpandedCitations(prev => ({
                      ...prev,
                      [item.id]: visibleCount + 5,
                    }))
                  }
                >
                  <Text style={styles.moreCitations}>
                    +{Math.min(5, item.citations.length - visibleCount)} more sources
                  </Text>
                </TouchableOpacity>
              )}

              {/* Optional SHOW LESS button */}
              {visibleCount >= item.citations.length &&
                item.citations.length > 5 && (
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedCitations(prev => ({
                        ...prev,
                        [item.id]: 5,
                      }))
                    }
                  >
                    <Text style={styles.moreCitations}>
                      Show less
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // ── Cohort Selection Screen ─────────────────────────────────────────────
  if (!session) {
    return (
        <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.selectScreen}>
          <Text style={styles.appTitle}>Patient Q&A</Text>
          <Text style={styles.appSubtitle}>Clinical AI Assistant</Text>
          <Text style={styles.selectLabel}>Select your patient cohort to begin</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {loading ? <ActivityIndicator size="large" color="#2563eb" /> : (
            <View style={styles.cohortButtons}>
              <TouchableOpacity style={[styles.cohortBtn, styles.cohortA]} onPress={() => selectCohort('A')}>
                <Text style={styles.cohortBtnText}>Group A</Text>
                <Text style={styles.cohortBtnSub}>65 patients</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cohortBtn, styles.cohortB]} onPress={() => selectCohort('B')}>
                <Text style={styles.cohortBtnText}>Group B</Text>
                <Text style={styles.cohortBtnSub}>55 patients</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
        </SafeAreaProvider>
    );
  }

  // ── Chat Screen ─────────────────────────────────────────────────────────
  return (
  <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Patient Q&A</Text>
          <Text style={styles.headerSub}>Group {session.cohort} · Variant {session.variant}</Text>
        </View>
        <TouchableOpacity style={styles.switchBtn} onPress={() => { setSession(null); setMessages([]); setInput('')}}>
          <Text style={styles.switchBtnText}>Switch Cohort</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            maxLength={200}
            onChangeText={(text) => {
              // Strip disallowed characters
              const sanitized = text.replace(/[^a-zA-Z0-9\s'&().,-?]/g, '');
              setInput(sanitized);
            }}
            placeholder="Ask about a patient..."
            placeholderTextColor="#9ca3af"
            multiline
            onSubmitEditing={sendMessage}
            editable={!loading}
          />
          {input.length >= 0 && (
            <Text style={styles.charCount}>
              {input.length}/200
            </Text>
          )}
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sendBtnText}>Send</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  // Cohort selection
  selectScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  appTitle: { fontSize: 32, fontWeight: '700', color: '#111827', marginBottom: 4 },
  appSubtitle: { fontSize: 16, color: '#6b7280', marginBottom: 48 },
  selectLabel: { fontSize: 16, color: '#374151', marginBottom: 24, textAlign: 'center' },
  errorText: { color: '#dc2626', marginBottom: 16, textAlign: 'center' },
  cohortButtons: { flexDirection: 'row', gap: 16 },
  cohortBtn: { flex: 1, padding: 24, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  cohortA: { backgroundColor: '#2563eb' },
  cohortB: { backgroundColor: '#7c3aed' },
  cohortBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  cohortBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6b7280' },
  switchBtn: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  switchBtnText: { fontSize: 13, color: '#374151', fontWeight: '600' },

  // Messages
  messageList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row' },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12 },
  userBubble: { backgroundColor: '#2563eb' },
  assistantBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  messageText: { fontSize: 15, color: '#111827', lineHeight: 22 },
  userText: { color: '#fff' },

  // Patient tag
  patientTag: { backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8, alignSelf: 'flex-start' },
  patientTagText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },

  // Warning
  warningTag: { backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 },
  warningText: { fontSize: 12, color: '#92400e', fontWeight: '600' },

  // Meta row
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  high: { backgroundColor: '#dcfce7' },
  medium: { backgroundColor: '#fef9c3' },
  low: { backgroundColor: '#fee2e2' },
  confidenceText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  variantText: { fontSize: 11, color: '#9ca3af' },

  // Citations
  citationsBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  citationsHeader: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  citation: { marginBottom: 4 },
  citationSource: { fontSize: 11, color: '#2563eb', fontWeight: '600' },
  citationValue: { fontSize: 11, color: '#374151' },
  moreCitations: { fontSize: 11, color: '#9ca3af', marginTop: 4 },

  // Input
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111827', maxHeight: 100 },
  charCount: { fontSize: 11, color: '#9ca3af', alignSelf: 'flex-end', paddingRight: 8 },
  sendBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#93c5fd' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
