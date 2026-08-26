import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { chats } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { userId: bodyUserId, sessionId, title, message, response } = body;

    // Get authenticated user or fallback to body userId
    const { userId: authUserId } = await auth();
    const userId = authUserId || bodyUserId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID is required' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const fallbackSessionId = sessionId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`);
    const fallbackTitle = title || (message.length > 28 ? message.substring(0, 28) + '...' : message);

    // Save to database
    const result = await db
      .insert(chats)
      .values({
        userId,
        sessionId: fallbackSessionId,
        title: fallbackTitle,
        message,
        response: response || '',
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        chat: result[0],
        chatId: result[0].id,
        sessionId: fallbackSessionId,
        message: 'Chat message saved successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving chat:', error);
    return NextResponse.json(
      { error: 'Failed to save chat message' },
      { status: 500 }
    );
  }
}
