'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  sessionId: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

const SUGGESTED_PROMPTS = [
  'How can I transition to a tech career?',
  'What skills should I develop for my next role?',
  'How do I prepare for a career change?',
  'What are the best opportunities in my field?',
];

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getFormattedTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AICoach() {
  const { user, isLoaded } = useUser();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initial chat session setup with unique sessionId
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const initialId = generateSessionId();
    return [
      {
        id: initialId,
        sessionId: initialId,
        title: 'New Conversation',
        createdAt: getFormattedDate(),
        messages: [],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0].id);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId || s.sessionId === activeSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isLoading]);

  // Load chat history grouped into sessions from DB on mount
  useEffect(() => {
    async function loadSavedChats() {
      try {
        const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
        const res = await fetch(`/api/chats/get${query}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions) && data.sessions.length > 0) {
          setSessions(data.sessions);
          setActiveSessionId(data.sessions[0].sessionId || data.sessions[0].id);
        }
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }

    if (isLoaded && user) {
      loadSavedChats();
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const createNewChat = () => {
    const newId = generateSessionId();
    const newSession: ChatSession = {
      id: newId,
      sessionId: newId,
      title: 'New Conversation',
      createdAt: getFormattedDate(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInput('');
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      const freshId = generateSessionId();
      setSessions([
        {
          id: freshId,
          sessionId: freshId,
          title: 'New Conversation',
          createdAt: getFormattedDate(),
          messages: [],
        },
      ]);
      setActiveSessionId(freshId);
      setInput('');
      return;
    }

    const updated = sessions.filter((s) => s.id !== id && s.sessionId !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated[0].sessionId || updated[0].id);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    setInput('');

    const targetSessionId = activeSession?.sessionId || activeSession?.id || activeSessionId;

    // Calculate dynamic session title based on first prompt (~28 chars)
    let sessionTitle = activeSession?.title || 'New Conversation';
    if (!activeSession?.messages || activeSession.messages.length === 0 || activeSession.title === 'New Conversation') {
      sessionTitle = messageContent.length > 28 ? messageContent.substring(0, 28) + '...' : messageContent;
    }

    const userMessage: Message = {
      id: generateId('msg'),
      sender: 'user',
      content: messageContent,
      timestamp: getFormattedTime(),
    };

    const currentHistory = (activeSession?.messages || []).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.content,
    }));

    // Update state immediately with user message & dynamic title
    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id === targetSessionId || session.sessionId === targetSessionId) {
          return {
            ...session,
            title: sessionTitle,
            messages: [...session.messages, userMessage],
          };
        }
        return session;
      })
    );

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          history: currentHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI coach response');
      }

      const assistantMessage: Message = {
        id: generateId('msg'),
        sender: 'assistant',
        content: data.response,
        timestamp: getFormattedTime(),
      };

      setSessions((prevSessions) =>
        prevSessions.map((session) => {
          if (session.id === targetSessionId || session.sessionId === targetSessionId) {
            return {
              ...session,
              messages: [...session.messages, assistantMessage],
            };
          }
          return session;
        })
      );

      // Save chat message, response, sessionId, and title to database
      fetch('/api/chats/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          sessionId: targetSessionId,
          title: sessionTitle,
          message: messageContent,
          response: data.response,
        }),
      }).catch((err) => console.warn('Could not save chat message:', err));

    } catch (error: any) {
      console.error('Error in chat:', error);
      const errorMessage: Message = {
        id: generateId('msg'),
        sender: 'assistant',
        content: `⚠️ ${error.message || 'Something went wrong. Please try again.'}`,
        timestamp: getFormattedTime(),
      };

      setSessions((prevSessions) =>
        prevSessions.map((session) => {
          if (session.id === targetSessionId || session.sessionId === targetSessionId) {
            return {
              ...session,
              messages: [...session.messages, errorMessage],
            };
          }
          return session;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden font-sans text-gray-800">
      {/* LOCAL SIDEBAR (Chat history list) */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm active:scale-98 text-sm"
          >
            <span>+ New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Chat History
          </div>

          {sessions.map((session) => {
            const isActive = session.id === activeSessionId || session.sessionId === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.sessionId || session.id);
                  setInput('');
                }}
                className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive
                  ? 'bg-blue-600/20 text-white border border-blue-500/40 font-medium'
                  : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-6">
                  <span className="text-blue-400 flex-shrink-0">💬</span>
                  <div className="truncate text-xs">{session.title}</div>
                </div>

                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity duration-200 rounded"
                  title="Delete chat"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-800 flex items-center gap-2 text-[10px] text-gray-400 justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Coach Sessions Active</span>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Message Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {(!activeSession.messages || activeSession.messages.length === 0) ? (
            /* EMPTY STATE */
            <div className="max-w-2xl mx-auto my-auto text-center py-12 px-4 animate-fadeIn">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner border border-blue-100">
                🤖
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
                Ready to Chat
              </h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                Ask questions about career progression, skills, resume mapping, or interview prep.
              </p>

              {/* Suggested Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto">
                {SUGGESTED_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(promptText)}
                    className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-300 text-gray-800 text-xs font-medium transition-all duration-200 shadow-sm text-left flex items-center justify-between group"
                  >
                    <span>{promptText}</span>
                    <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* CHAT MESSAGES */
            <div className="max-w-3xl mx-auto space-y-6">
              {activeSession.messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 animate-fadeInUp ${isUser ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm mt-1">
                        🤖
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm space-y-1 ${isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-gray-100 text-gray-900 rounded-tl-none border border-gray-200/60'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <span
                        className={`text-[9px] block text-right mt-1 ${isUser ? 'text-blue-200' : 'text-gray-400'
                          }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-gray-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm mt-1">
                        {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex gap-3 items-center animate-fadeIn">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                    🤖
                  </div>
                  <div className="bg-gray-100 border border-gray-200/60 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Sticky Input Area */}
        <footer className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-20">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl transition-all duration-200 shadow-sm">
              <textarea
                value={input}
                maxLength={1000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your career coach anything..."
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="mr-3 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            <div className="flex justify-between items-center px-1 text-[10px] text-gray-400">
              <span>Shift + Enter for new line</span>
              <span>{input.length}/1000 characters</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
