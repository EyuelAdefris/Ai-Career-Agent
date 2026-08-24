import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import jsPDF from 'jspdf';

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
      skills,
    } = body;

    // Validate required fields
    if (!fullName) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    // Create PDF
    const pdf = new jsPDF();
    let yPosition = 20;

    // Header - Name
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(fullName, 20, yPosition);
    yPosition += 10;

    // Profession
    if (profession) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(profession, 20, yPosition);
      yPosition += 8;
    }

    // Contact Info
    pdf.setFontSize(10);
    let contactInfo = [];
    if (email) contactInfo.push(email);
    if (phone) contactInfo.push(phone);
    if (location) contactInfo.push(location);
    pdf.text(contactInfo.join(' • '), 20, yPosition);
    yPosition += 8;

    // Divider line
    pdf.setDrawColor(0, 123, 255);
    pdf.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    // Professional Summary
    if (summary) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Professional Summary', 20, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const summaryLines = pdf.splitTextToSize(summary, 170);
      pdf.text(summaryLines, 20, yPosition);
      yPosition += summaryLines.length * 5 + 5;
    }

    // Experience
    if (experience && experience.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Professional Experience', 20, yPosition);
      yPosition += 7;

      experience.forEach((exp: any) => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${exp.position} - ${exp.company}`, 20, yPosition);
        yPosition += 5;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(exp.duration, 20, yPosition);
        yPosition += 5;

        if (exp.description) {
          const descLines = pdf.splitTextToSize(exp.description, 170);
          pdf.text(descLines, 20, yPosition);
          yPosition += descLines.length * 4 + 3;
        }
      });

      yPosition += 3;
    }

    // Skills
    if (skills && skills.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Skills', 20, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const skillsText = skills.join(', ');
      const skillsLines = pdf.splitTextToSize(skillsText, 170);
      pdf.text(skillsLines, 20, yPosition);
    }

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Return PDF file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fullName.replace(/\\s+/g, '_')}_resume.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
