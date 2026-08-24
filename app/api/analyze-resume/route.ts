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
          matchScore: { type: Type.INTEGER },
          summary: { type: Type.STRING },
          missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['matchScore', 'summary', 'missingKeywords', 'strengths', 'improvements'],
      },
    },
  });
}

export async function POST(req: Request) {
  try {
    const { resumeContent, jobDescription } = await req.json();

    if (!resumeContent || !resumeContent.trim()) {
      return NextResponse.json({ error: 'Resume content is required.' }, { status: 400 });
    }

    const hasTargetJob = Boolean(jobDescription && jobDescription.trim());

    const prompt = `
      You are an expert ATS evaluator. Analyze the candidate's resume content.
      RESUME CONTENT:
      ${resumeContent}
      ${
        hasTargetJob
          ? `TARGET JOB DESCRIPTION:\n${jobDescription}`
          : `Perform a general ATS resume audit and score quality out of 100.`
      }
    `;

    let response;
    try {
      // Primary model attempt
      response = await callGemini('gemini-3.6-flash', prompt);
    } catch (primaryError: any) {
      const isQuotaError = 
        primaryError?.status === 429 || 
        primaryError?.message?.includes('429') || 
        primaryError?.message?.includes('Quota exceeded');

      if (isQuotaError) {
        console.warn('Gemini 3.6 quota reached. Downgrading fallback to gemini-2.0-flash...');
        try {
          // Fallback model attempt
          response = await callGemini('gemini-2.0-flash', prompt);
        } catch (fallbackError: any) {
          return NextResponse.json(
            { error: 'Daily Gemini API free quota limit reached. Please wait a few minutes or try again tomorrow.' },
            { status: 429 }
          );
        }
      } else {
        throw primaryError;
      }
    }

    const analysisResult = JSON.parse(response.text || '{}');
    return NextResponse.json(analysisResult, { status: 200 });

  } catch (error) {
    console.error('Gemini Resume Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume. Please try again later.' },
      { status: 500 }
    );
  }
}
