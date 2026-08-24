import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { roadmaps } from '@/db/schema';
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

    // Fetch user's roadmaps from database
    const userRoadmaps = await db
      .select()
      .from(roadmaps)
      .where(eq(roadmaps.userId, userId))
      .orderBy(roadmaps.createdAt);

    return NextResponse.json(
      {
        success: true,
        roadmaps: userRoadmaps,
        count: userRoadmaps.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roadmaps' },
      { status: 500 }
    );
  }
}
