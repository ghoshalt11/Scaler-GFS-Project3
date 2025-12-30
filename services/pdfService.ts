import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { StrategicPlan, Recommendation, StakeholderRole } from "../types";

export const exportPlanToPDF = (plan: StrategicPlan, xValue: number, yValue: number) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ProfitPath AI", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Strategic Yield & Profitability Roadmap", 15, 30);
  
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

  const tableData = plan.recommendations.map(rec => {
    const displayImpact = rec.estimatedImpact.startsWith('+') ? rec.estimatedImpact : `+${rec.estimatedImpact}`;
    return [
      rec.category,
      rec.action,
      rec.goal,
      rec.priority,
      displayImpact
    ];
  });

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
      `ProfitPath AI - Strategic Analysis for Your Property - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`ProfitPath_Strategic_Roadmap_${xValue}pct.pdf`);
};

/**
 * Exports a role-specific strategy report
 */
export const exportRoleStrategyToPDF = (
  role: StakeholderRole,
  recommendations: Recommendation[],
  summary: string,
  location: string,
  targetIncrease: number,
  timeline: number
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Branding Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ProfitPath AI", 20, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`${role.toUpperCase()} - STRATEGIC EXECUTION PLAN`, 20, 30);
  doc.text(`${location.toUpperCase()}`, 20, 38);

  // Growth Target Pill
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 85, 12, 65, 22, 3, 3, 'F');
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TARGET GROWTH", pageWidth - 80, 19);
  doc.setFontSize(14);
  doc.text(`+${targetIncrease}% in ${timeline}M`, pageWidth - 80, 28);

  // Summary Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Insight", 20, 60);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 64, 80, 64);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const splitSummary = doc.splitTextToSize(summary, pageWidth - 40);
  doc.text(splitSummary, 20, 72);

  const summaryHeight = splitSummary.length * 6;
  const tableStartY = 85 + summaryHeight;

  // Table Heading
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Tailored Action Items", 20, tableStartY);

  // Recommendations Table
  const tableData = recommendations.map(rec => {
    const displayImpact = rec.estimatedImpact.startsWith('+') ? rec.estimatedImpact : `+${rec.estimatedImpact}`;
    return [
      rec.priority,
      rec.category,
      rec.action,
      rec.goal,
      displayImpact
    ];
  });

  autoTable(doc, {
    startY: tableStartY + 5,
    margin: { left: 20, right: 20 },
    head: [['Priority', 'Category', 'Action', 'Target Goal', 'Impact']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [79, 70, 229], 
      fontSize: 10, 
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 4
    },
    bodyStyles: { 
      fontSize: 9, 
      cellPadding: 4,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      1: { cellWidth: 25 },
      2: { cellWidth: 45, fontStyle: 'bold' },
      3: { cellWidth: 50 },
      4: { halign: 'center', fontStyle: 'bold', textColor: [16, 185, 129] }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 0) {
        const priority = data.cell.raw as string;
        if (priority === 'High') data.cell.styles.textColor = [220, 38, 38];
        if (priority === 'Medium') data.cell.styles.textColor = [217, 119, 6];
        if (priority === 'Low') data.cell.styles.textColor = [16, 185, 129];
      }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Confidential Strategy Report - Generated by ProfitPath AI - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  const fileName = `${role.replace(/\s+/g, '_')}_Strategy_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Simplified Bot Drawing for PDF (resembling the BotIcon component)
const drawBotIcon = (doc: jsPDF, x: number, y: number, size: number, color: number[]) => {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.3);
  
  // Head
  doc.roundedRect(x + (size * 0.2), y + (size * 0.35), size * 0.6, size * 0.5, size * 0.1, size * 0.1, 'D');
  // Ears
  doc.roundedRect(x + (size * 0.05), y + (size * 0.5), size * 0.15, size * 0.2, size * 0.05, size * 0.05, 'D');
  doc.roundedRect(x + (size * 0.8), y + (size * 0.5), size * 0.15, size * 0.2, size * 0.05, size * 0.05, 'D');
  // Antenna
  doc.line(x + (size * 0.4), y + (size * 0.35), x + (size * 0.4), y + (size * 0.2));
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(x + (size * 0.4), y + (size * 0.17), size * 0.05, 'F');
  // Eyes
  doc.circle(x + (size * 0.4), y + (size * 0.55), size * 0.05, 'D');
  doc.circle(x + (size * 0.6), y + (size * 0.55), size * 0.05, 'D');
  // Mouth (Simple line)
  doc.line(x + (size * 0.45), y + (size * 0.7), x + (size * 0.55), y + (size * 0.7));
};

const drawAvatar = (doc: jsPDF, x: number, y: number, isUser: boolean) => {
  const size = 10;
  if (isUser) {
    doc.setFillColor(79, 70, 229);
    // Person Icon 
    doc.circle(x + size / 2, y + size * 0.3, size * 0.2, 'F');
    doc.ellipse(x + size / 2, y + size * 0.8, size * 0.4, size * 0.2, 'F');
  } else {
    drawBotIcon(doc, x, y, size, [79, 70, 229]);
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
    const isTableLine = line.startsWith('|') && line.includes('|');

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
  const contentX = margin + 15; // Where the text actually starts (to the right of icon)
  const maxLineWidth = pageWidth - contentX - margin;

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Header Icon
  drawBotIcon(doc, margin, 8, 18, [255, 255, 255]);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AI Business Strategist", margin + 22, 20);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Intelligent Strategy Consultation Session", margin + 22, 28);

  let yOffset = 50;

  messages.forEach((msg) => {
    // Check for page break before starting new message
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 25;
    }

    // Avatar Icon
    drawAvatar(doc, margin, yOffset, msg.role === 'user');

    // Message Prefix for Flow
    const rolePrefix = msg.role === 'user' ? 'YOU: ' : 'STRATEGIST: ';
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    const blocks = parseMarkdownTables(msg.text);
    let isFirstBlock = true;

    blocks.forEach((block) => {
      if (block.type === 'text') {
        // Clean text from basic markdown
        let cleanText = block.content
          .replace(/#{1,6}\s?/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/-\s/g, '• ')
          .trim();

        if (isFirstBlock) {
          // Prepend role prefix to first line of text
          const prefixAndText = rolePrefix + cleanText;
          const splitLines = doc.splitTextToSize(prefixAndText, maxLineWidth);
          
          splitLines.forEach((line: string, lineIdx: number) => {
            if (yOffset > 275) {
              doc.addPage();
              yOffset = 25;
            }
            
            // Highlight the prefix in bold/grey
            if (lineIdx === 0) {
              doc.setFont("helvetica", "bold");
              doc.setTextColor(148, 163, 184);
              doc.setFontSize(8);
              doc.text(rolePrefix, contentX, yOffset + 1); // small offset adjustment for baseline
              
              const prefixWidth = doc.getTextWidth(rolePrefix);
              
              doc.setFont("helvetica", "normal");
              doc.setTextColor(30, 41, 59);
              doc.setFontSize(10);
              // Extract original line content minus prefix for correct rendering position
              const lineContent = line.substring(rolePrefix.length);
              doc.text(lineContent, contentX + prefixWidth, yOffset + 1);
            } else {
              doc.setFont("helvetica", "normal");
              doc.setTextColor(30, 41, 59);
              doc.setFontSize(10);
              doc.text(line, contentX, yOffset + 1);
            }
            yOffset += 5.5;
          });
          isFirstBlock = false;
        } else {
          // Standard text block
          const splitLines = doc.splitTextToSize(cleanText, maxLineWidth);
          splitLines.forEach((line: string) => {
            if (yOffset > 275) {
              doc.addPage();
              yOffset = 25;
            }
            doc.text(line, contentX, yOffset + 1);
            yOffset += 5.5;
          });
        }
        yOffset += 2;
      } else if (block.type === 'table') {
        if (yOffset > 240) {
          doc.addPage();
          yOffset = 25;
        }

        autoTable(doc, {
          startY: yOffset,
          head: [block.content.headers],
          body: block.content.rows,
          margin: { left: contentX, right: margin },
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229], fontSize: 8, fontStyle: 'bold' },
          bodyStyles: { fontSize: 8 },
          styles: { cellPadding: 2 }
        });
        
        yOffset = (doc as any).lastAutoTable.finalY + 8;
        isFirstBlock = false;
      }
    });

    // Substantial gap between messages for clarity
    yOffset += 12;
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ProfitPath AI Strategy Session Report - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`ProfitPath_Consultation_${new Date().getTime()}.pdf`);
};
