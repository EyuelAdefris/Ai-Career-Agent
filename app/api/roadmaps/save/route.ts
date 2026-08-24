import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { roadmaps } from '@/db/schema';

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
    const {
      targetTitle,
      targetCompany,
      timeline,
      industry,
      skillsToLearn,
      workMode,
      salaryRange,
      roadmapData,
    } = body;

    // Validate required fields
    if (!targetTitle || !timeline || !industry) {
      return NextResponse.json(
        { error: 'Target title, timeline, and industry are required' },
        { status: 400 }
      );
    }

    // Save to database
    const result = await db
      .insert(roadmaps)
      .values({
        userId,
        targetTitle,
        targetCompany,
        timeline,
        industry,
        skillsToLearn,
        workMode,
        salaryRange,
        roadmapData,
      })
      .returning({ id: roadmaps.id });

    return NextResponse.json(
      {
        success: true,
        roadmapId: result[0].id,
        message: 'Career roadmap saved successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to save roadmap' },
      { status: 500 }
    );
  }
}
