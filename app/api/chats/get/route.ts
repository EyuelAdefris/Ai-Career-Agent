import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { chats } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    try {
        // Get authenticated user
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch user's chat messages from database
        const userChats = await db
            .select()
            .from(chats)
            .where(eq(chats.userId, userId))
            .orderBy(chats.createdAt);

        return NextResponse.json(
            {
                success: true,
                chats: userChats,
                count: userChats.length,
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