import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { resumes } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body for the resume ID
    const body = await req.json();
    const { resumeId } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // Delete the specific resume making sure it belongs to the authenticated user
    await db
      .delete(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));

    return NextResponse.json(
      {
        success: true,
        message: 'Resume deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
