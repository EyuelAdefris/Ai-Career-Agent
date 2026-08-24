import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { chats } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { message, response } = body;

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Save to database
    const result = await db
      .insert(chats)
      .values({
        userId,
        message,
        response: response || null,
      })
      .returning({ id: chats.id });

    return NextResponse.json(
      {
        success: true,
        chatId: result[0].id,
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
