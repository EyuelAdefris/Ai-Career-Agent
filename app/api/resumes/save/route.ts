import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { resumes } from '@/db/schema';

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
      fullName,
      profession,
      email,
      phone,
      location,
      summary,
      experience,
      education,
      skills,
    } = body;

    // Validate required fields
    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    // Save to database
    const result = await db
      .insert(resumes)
      .values({
        userId,
        fullName,
        profession,
        email,
        phone,
        location,
        summary,
        experience,
        education,
        skills,
      })
      .returning({ id: resumes.id });

    return NextResponse.json(
      {
        success: true,
        resumeId: result[0].id,
        message: 'Resume saved successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving resume:', error);
    return NextResponse.json(
      { error: 'Failed to save resume' },
      { status: 500 }
    );
  }
}
