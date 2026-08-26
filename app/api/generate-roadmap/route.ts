import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function callGemini(modelName: string, prompt: string) {
  return await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      temperature: 0,
      seed: 42,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roadmap: {
            type: Type.ARRAY,
            description: 'Structured sequential learning and career progression phases',
            items: {
              type: Type.OBJECT,
              properties: {
                phase: { type: Type.INTEGER, description: 'Phase number (e.g. 1, 2, 3)' },
                title: { type: Type.STRING, description: 'Core theme of this phase' },
                duration: { type: Type.STRING, description: 'Estimated timeframe (e.g. 4 months)' },
                color: { type: Type.STRING, description: 'Color theme for the phase UI (must be one of: "blue", "purple", "teal", "indigo")' },
                activities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Actionable steps and tasks to complete during this phase',
                },
                skills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Key tools, frameworks, concepts, and technical skills to master',
                },
                milestones: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Key milestones or achievements to validate phase completion',
                },
              },
              required: ['phase', 'title', 'duration', 'color', 'activities', 'skills', 'milestones'],
            },
          },
        },
        required: ['roadmap'],
      },
    },
  });
}

export async function POST(req: Request) {
  try {
    const { targetTitle, timeline, industry, skillsToLearn, workMode, experienceLevel } = await req.json();

    if (!targetTitle || !targetTitle.trim()) {
      return NextResponse.json(
        { error: 'Target job title or career goal is required.' },
        { status: 400 }
      );
    }

    const prompt = `
      You are an expert tech career strategist and senior technical mentor.
      Create a highly structured, actionable, multi-phase career roadmap tailored to the following candidate profile:

      TARGET JOB / GOAL: ${targetTitle}
      TARGET TIMELINE: ${timeline || '1 year'}
      INDUSTRY / FIELD: ${industry || 'Technology'}
      SPECIFIC SKILLS TO LEARN / FOCUS ON: ${Array.isArray(skillsToLearn) ? skillsToLearn.join(', ') : (skillsToLearn || 'Industry standard stack')}
      PREFERRED WORK MODE: ${workMode || 'Hybrid'}
      CURRENT EXPERIENCE LEVEL: ${experienceLevel || 'Beginner to Intermediate'}

      REQUIREMENTS:
      1. Divide the roadmap into logical sequential phases (typically 3 to 5 phases depending on timeline).
      2. For each phase, provide a specific title, duration, activities, skills to learn, and milestones.
      3. Tailor recommendations specifically to the user's focus skills and target timeline.
      4. Assign an alternating color to each phase: "blue", "purple", "teal", "indigo".
    `;

    let response;
    try {
      // Primary attempt
      response = await callGemini('gemini-3.6-flash', prompt);
    } catch (primaryError: any) {
      const isQuotaError = 
        primaryError?.status === 429 || 
        primaryError?.message?.includes('429') || 
        primaryError?.message?.includes('Quota exceeded');

      if (isQuotaError) {
        console.warn('Gemini 3.6 quota reached. Downgrading fallback to gemini-2.0-flash...');
        try {
          response = await callGemini('gemini-2.0-flash', prompt);
        } catch (fallbackError: any) {
          return NextResponse.json(
            { error: 'Daily Gemini API quota limit reached. Please wait a few minutes or try again later.' },
            { status: 429 }
          );
        }
      } else {
        throw primaryError;
      }
    }

    const parsedData = JSON.parse(response.text || '{}');
    return NextResponse.json(parsedData.roadmap || [], { status: 200 });

  } catch (error) {
    console.error('Gemini Roadmap Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate career roadmap. Please try again.' },
      { status: 500 }
    );
  }
}
