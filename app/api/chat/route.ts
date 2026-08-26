import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert AI Career Coach, Tech Lead, and Interview Mentor. 
Your role is to help developers and job seekers with:
- Tailored career strategy and advice
- Technical & behavioral interview preparation (mock interviews, STAR framework)
- Resume, portfolio, and code review insights
- Salary negotiation and career transition guidance

Keep responses clear, actionable, encouraging, and structured (use bolding and bullet points where helpful).
`;

async function callChatModel(modelName: string, contents: any[]) {
  return await ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message content is required.' },
        { status: 400 }
      );
    }

    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      history.forEach((h: { role: string; text: string }) => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    let response;
    try {
      response = await callChatModel('gemini-3.6-flash', contents);
    } catch (primaryError: any) {
      const isQuotaError = 
        primaryError?.status === 429 || 
        primaryError?.message?.includes('429') || 
        primaryError?.message?.includes('Quota exceeded');

      if (isQuotaError) {
        console.warn('Gemini 3.6 quota reached in chat route. Falling back to gemini-2.0-flash...');
        try {
          response = await callChatModel('gemini-2.0-flash', contents);
        } catch (fallbackError: any) {
          return NextResponse.json(
            { error: 'Daily Gemini API quota limit reached. Please try again shortly.' },
            { status: 429 }
          );
        }
      } else {
        throw primaryError;
      }
    }

    const reply = response.text || 'I apologize, but I could not generate a response. Please try asking again.';
    return NextResponse.json({ response: reply }, { status: 200 });

  } catch (error) {
    console.error('Gemini Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete chat request. Please try again.' },
      { status: 500 }
    );
  }
}
