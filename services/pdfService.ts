
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { StrategicPlan } from "../types";

export const exportPlanToPDF = (plan: StrategicPlan, xValue: number, yValue: number) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RevElevate AI", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Strategic Profitability Roadmap", 15, 30);
  
  doc.text(`Target: +${xValue}% Profit in ${yValue} Months`, pageWidth - 15, 30, { align: "right" });

  // Summary
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 15, 55);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const splitSummary = doc.splitTextToSize(plan.summary, pageWidth - 30);
  doc.text(splitSummary, 15, 65);

  const summaryHeight = splitSummary.length * 5;
  const tableStartY = 75 + summaryHeight;

  // Recommendations Table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Strategic Action Items", 15, tableStartY - 5);

  const tableData = plan.recommendations.map(rec => [
    rec.category,
    rec.action,
    rec.goal,
    rec.priority,
    `+${rec.estimatedImpact}`
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Category', 'Action', 'Goal', 'Priority', 'Impact']],
    body: tableData,
    headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { cellWidth: 60 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20, fontStyle: 'bold', textColor: [79, 70, 229] }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `RevElevate AI - Strategic Analysis for Your Property - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`RevElevate_Strategic_Roadmap_${xValue}pct.pdf`);
};

const drawAvatar = (doc: jsPDF, x: number, y: number, isUser: boolean) => {
  const size = 8;
  doc.setLineWidth(0.5);
  doc.setDrawColor(79, 70, 229);
  doc.setFillColor(79, 70, 229);

  if (isUser) {
    // Person Icon (Circle Head + Shoulders)
    doc.circle(x + size / 2, y - size * 0.7, size * 0.18, 'F');
    doc.setLineWidth(1.5);
    doc.line(x + size * 0.2, y - size * 0.25, x + size * 0.8, y - size * 0.25);
    doc.setLineWidth(0.4);
    doc.circle(x + size / 2, y - size / 2, size / 2, 'S');
  } else {
    // Bot Icon (Square + Eyes + Antenna)
    const rectX = x + size * 0.1;
    const rectY = y - size * 0.85;
    const rectW = size * 0.8;
    const rectH = size * 0.7;
    doc.rect(rectX, rectY, rectW, rectH, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(rectX + rectW * 0.3, rectY + rectH * 0.4, size * 0.08, 'F');
    doc.circle(rectX + rectW * 0.7, rectY + rectH * 0.4, size * 0.08, 'F');
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(x + size / 2, rectY, x + size / 2, y - size * 1.1);
    doc.circle(x + size / 2, y - size * 1.15, size * 0.06, 'F');
  }
};

const parseMarkdownTables = (text: string) => {
  const parts: { type: 'text' | 'table', content: any }[] = [];
  const lines = text.split('\n');
  let currentTextBlock: string[] = [];
  let currentTableLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableLine = line.startsWith('|') && line.endsWith('|');

    if (isTableLine) {
      if (!inTable) {
        if (currentTextBlock.length > 0) {
          parts.push({ type: 'text', content: currentTextBlock.join('\n') });
          currentTextBlock = [];
        }
        inTable = true;
      }
      currentTableLines.push(line);
    } else {
      if (inTable) {
        // Table ended
        if (currentTableLines.length >= 2) {
          const headers = currentTableLines[0].split('|').map(s => s.trim()).filter(s => s !== '');
          const rows = currentTableLines.slice(2).map(l => l.split('|').map(s => s.trim()).filter(s => s !== ''));
          parts.push({ type: 'table', content: { headers, rows } });
        } else {
          currentTextBlock.push(...currentTableLines);
        }
        currentTableLines = [];
        inTable = false;
      }
      currentTextBlock.push(lines[i]);
    }
  }

  // Handle final blocks
  if (inTable) {
    if (currentTableLines.length >= 2) {
      const headers = currentTableLines[0].split('|').map(s => s.trim()).filter(s => s !== '');
      const rows = currentTableLines.slice(2).map(l => l.split('|').map(s => s.trim()).filter(s => s !== ''));
      parts.push({ type: 'table', content: { headers, rows } });
    } else {
      currentTextBlock.push(...currentTableLines);
    }
  } else if (currentTextBlock.length > 0) {
    parts.push({ type: 'text', content: currentTextBlock.join('\n') });
  }

  return parts;
};

export const exportChatToPDF = (messages: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxLineWidth = pageWidth - margin * 2;

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RevElevate AI - Strategy Consultation", margin, 20);

  let yOffset = 45;

  messages.forEach((msg) => {
    const isUser = msg.role === 'user';
    
    // Page check for avatar
    if (yOffset > 260) {
      doc.addPage();
      yOffset = 25;
    }

    drawAvatar(doc, margin, yOffset, isUser);
    yOffset += 8;

    const blocks = parseMarkdownTables(msg.text);

    blocks.forEach((block) => {
      if (block.type === 'text') {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        
        const cleanText = block.content
          .replace(/###\s?/g, '')
          .replace(/\*\*/g, '')
          .replace(/-\s/g, '• ')
          .trim();

        const splitLines = doc.splitTextToSize(cleanText, maxLineWidth);
        
        splitLines.forEach((line: string) => {
          if (yOffset > 280) {
            doc.addPage();
            yOffset = 25;
          }
          doc.text(line, margin, yOffset);
          yOffset += 5;
        });
        yOffset += 5;
      } else if (block.type === 'table') {
        if (yOffset > 240) { // Anticipate table height
          doc.addPage();
          yOffset = 25;
        }

        autoTable(doc, {
          startY: yOffset,
          head: [block.content.headers],
          body: block.content.rows,
          margin: { left: margin, right: margin },
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          styles: { overflow: 'linebreak', cellPadding: 2 },
          didDrawPage: (data) => {
            yOffset = data.cursor?.y || yOffset;
          }
        });
        
        // Update yOffset after table
        yOffset = (doc as any).lastAutoTable.finalY + 10;
      }
    });

    yOffset += 10; // Space between messages
  });

  // Page Numbers Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `RevElevate AI - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`RevElevate_Strategy_Session_${new Date().toISOString().split('T')[0]}.pdf`);
};
