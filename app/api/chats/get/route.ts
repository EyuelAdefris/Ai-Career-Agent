import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { chats } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user or fallback to searchParams userId
    const { userId: authUserId } = await auth();
    const { searchParams } = new URL(req.url);
    const paramUserId = searchParams.get('userId');
    const userId = authUserId || paramUserId;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID is required' },
        { status: 401 }
      );
    }

    // Fetch user's chat messages from database
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(chats.createdAt);

    // Group userChats into sessions by sessionId
    const sessionsMap = new Map<string, any>();

    userChats.forEach((chat) => {
      const sId = chat.sessionId || `session-${chat.id}`;
      if (!sessionsMap.has(sId)) {
        const dateStr = chat.createdAt
          ? new Date(chat.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '';
        sessionsMap.set(sId, {
          id: sId,
          sessionId: sId,
          title: chat.title || (chat.message.length > 28 ? chat.message.substring(0, 28) + '...' : chat.message),
          createdAt: dateStr,
          messages: [],
        });
      }

      const session = sessionsMap.get(sId)!;
      const timeStr = chat.createdAt
        ? new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

      session.messages.push({
        id: `db-user-${chat.id}`,
        sender: 'user',
        content: chat.message,
        timestamp: timeStr,
      });

      if (chat.response) {
        session.messages.push({
          id: `db-ai-${chat.id}`,
          sender: 'assistant',
          content: chat.response,
          timestamp: timeStr,
        });
      }
    });

    const sessions = Array.from(sessionsMap.values());

    return NextResponse.json(
      {
        success: true,
        sessions,
        count: sessions.length,
        chats: userChats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}