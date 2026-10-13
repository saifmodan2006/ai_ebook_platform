import { jsPDF } from 'jspdf';
import { Book } from '../types/book';

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return [r, g, b];
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return [r, g, b];
}

export function generateBookPdf(book: Book): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2; // 170mm

  const [pr, pg, pb] = hexToRgb(book.theme.primaryColor || '#1e1b4b');
  const [sr, sg, sb] = hexToRgb(book.theme.secondaryColor || '#4338ca');
  const [ar, ag, ab] = hexToRgb(book.theme.accentColor || '#06b6d4');

  // ==========================================
  // PAGE 1: FULL COLOR COVER PAGE
  // ==========================================
  // Fill background
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Subtle geometric top-right accent corner
  doc.setFillColor(sr, sg, sb);
  doc.triangle(140, 0, pageWidth, 0, pageWidth, 70, 'F');

  // Thin gold/cyan accent framing lines
  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(1.2);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S');

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28, 'S');

  // Pill badge: Category or Lead Magnet Edition
  const badgeText = (book.category || 'EXECUTIVE LEAD MAGNET').toUpperCase();
  doc.setFillColor(ar, ag, ab);
  doc.roundedRect(marginX + 2, 38, 70, 7.5, 3, 3, 'F');
  doc.setTextColor(pr, pg, pb);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(badgeText, marginX + 6, 43);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  const titleLines = doc.splitTextToSize(book.title, contentWidth - 8);
  let coverY = 62;
  doc.text(titleLines, marginX + 2, coverY);
  coverY += titleLines.length * 11 + 6;

  // Accent divider line
  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(1.5);
  doc.line(marginX + 2, coverY, marginX + 45, coverY);
  coverY += 10;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(220, 225, 235);
  const subLines = doc.splitTextToSize(book.subtitle, contentWidth - 10);
  doc.text(subLines, marginX + 2, coverY);
  coverY += subLines.length * 6.5 + 14;

  // Center vector ornament box
  doc.setFillColor(sr, sg, sb);
  doc.roundedRect(marginX + 2, coverY, contentWidth - 4, 38, 4, 4, 'F');
  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(0.6);
  doc.roundedRect(marginX + 2, coverY, contentWidth - 4, 38, 4, 4, 'S');

  doc.setTextColor(ar, ag, ab);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('KEY VALUE TRANSFORMATION', marginX + 8, coverY + 9);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  const transLines = doc.splitTextToSize(`"${book.persona.coreTransformation}"`, contentWidth - 20);
  doc.text(transLines, marginX + 8, coverY + 18);

  // Bottom Author & Publication metadata
  const bottomY = pageHeight - 34;
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.line(marginX + 2, bottomY - 6, pageWidth - marginX - 2, bottomY - 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 190, 210);
  doc.text('AUTHOR & COMPILATION', marginX + 2, bottomY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(book.author, marginX + 2, bottomY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 190, 210);
  doc.text(`Estimated Read: ${book.readTimeMinutes} mins   •   4 Action Chapters`, marginX + 2, bottomY + 14);

  // ==========================================
  // PAGE HELPER FUNCTIONS
  // ==========================================
  let currentPage = 1;

  function addRunningHeaderFooter(titleText: string) {
    // Running Header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 145);
    doc.text(book.title.toUpperCase(), marginX, 13);
    doc.text(titleText.toUpperCase(), pageWidth - marginX, 13, { align: 'right' });

    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.line(marginX, 15.5, pageWidth - marginX, 15.5);

    // Running Footer
    doc.setDrawColor(220, 225, 235);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);

    doc.text('PageCraft AI Publishing Studio', marginX, pageHeight - 9);
    doc.text(`Page ${currentPage}`, pageWidth - marginX, pageHeight - 9, { align: 'right' });
  }

  // ==========================================
  // PAGE 2: TABLE OF CONTENTS & PERSONA BRIEF
  // ==========================================
  doc.addPage();
  currentPage++;
  addRunningHeaderFooter('Contents & Persona');

  let y = 28;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(pr, pg, pb);
  doc.text('Table of Contents', marginX, y);
  y += 10;

  // TOC Entries
  const tocEntries = [
    { label: 'Demographic Persona & Strategic Alignment', page: 'Page 2' },
    ...book.chapters.map((ch, idx) => ({
      label: `Chapter ${ch.chapterNumber}: ${ch.title}  [${ch.pillBadge}]`,
      page: `Chapter ${idx + 1}`,
    })),
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  tocEntries.forEach((entry) => {
    doc.setTextColor(40, 50, 70);
    doc.text(entry.label, marginX, y);

    // Dots leader
    doc.setDrawColor(190, 200, 215);
    doc.setLineDashPattern([1, 2], 0);
    doc.setLineWidth(0.3);
    doc.line(marginX + doc.getTextWidth(entry.label) + 3, y - 0.5, pageWidth - marginX - 22, y - 0.5);
    doc.setLineDashPattern([], 0); // reset dash

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(pr, pg, pb);
    doc.text(entry.page, pageWidth - marginX, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 8.5;
  });

  y += 6;

  // Demographic Persona Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, y, contentWidth, 90, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(marginX, y, contentWidth, 90, 3, 3, 'S');

  // Left colored vertical accent stripe
  doc.setFillColor(pr, pg, pb);
  doc.rect(marginX, y, 4, 90, 'F');

  let py = y + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(pr, pg, pb);
  doc.text('STRATEGIC DEMOGRAPHIC PERSONA', marginX + 10, py);

  doc.setFillColor(ar, ag, ab);
  doc.roundedRect(pageWidth - marginX - 35, y + 6, 28, 6, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(pr, pg, pb);
  doc.text('TARGET ICP', pageWidth - marginX - 21, y + 10.2, { align: 'center' });

  py += 9;

  // Persona attributes
  const personaFields = [
    { label: 'Target Role / Title', val: book.persona.targetRole },
    { label: 'Industry Sector', val: book.persona.industry },
    { label: 'Core Pain Point', val: book.persona.mainPainPoint },
    { label: 'Target Transformation', val: book.persona.coreTransformation },
    { label: 'Ideal Audience Profile', val: book.persona.idealAudienceDescription },
  ];

  personaFields.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label.toUpperCase(), marginX + 10, py);
    py += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(item.val, contentWidth - 18);
    doc.text(lines, marginX + 10, py);
    py += lines.length * 4.8 + 3;
  });

  // ==========================================
  // CHAPTERS 1 TO 4
  // ==========================================
  book.chapters.forEach((chapter) => {
    doc.addPage();
    currentPage++;
    addRunningHeaderFooter(`Chapter ${chapter.chapterNumber}`);

    let cy = 26;

    // Chapter Pill Badge
    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(marginX, cy, 38, 7, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`CHAPTER ${chapter.chapterNumber} • ${chapter.pillBadge.toUpperCase()}`, marginX + 19, cy + 4.8, {
      align: 'center',
    });
    cy += 12;

    // Chapter Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(pr, pg, pb);
    const chTitleLines = doc.splitTextToSize(chapter.title, contentWidth);
    doc.text(chTitleLines, marginX, cy);
    cy += chTitleLines.length * 8 + 4;

    // Executive Summary Box
    doc.setFillColor(241, 245, 249);
    const sumLines = doc.splitTextToSize(chapter.summaryBox, contentWidth - 16);
    const sumBoxHeight = sumLines.length * 5 + 14;
    doc.roundedRect(marginX, cy, contentWidth, sumBoxHeight, 2.5, 2.5, 'F');

    // Left border stripe for summary box
    doc.setFillColor(ar, ag, ab);
    doc.rect(marginX, cy, 3, sumBoxHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(pr, pg, pb);
    doc.text('EXECUTIVE SUMMARY', marginX + 8, cy + 6.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(sumLines, marginX + 8, cy + 12);
    cy += sumBoxHeight + 8;

    // Subheadings
    chapter.subheadings.forEach((sub) => {
      // Check page overflow
      if (cy > pageHeight - 45) {
        doc.addPage();
        currentPage++;
        addRunningHeaderFooter(`Chapter ${chapter.chapterNumber}`);
        cy = 26;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(pr, pg, pb);
      doc.text(sub.title, marginX, cy);
      cy += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const contentLines = doc.splitTextToSize(sub.content, contentWidth);
      doc.text(contentLines, marginX, cy);
      cy += contentLines.length * 4.8 + 6;
    });

    // Pull Quote Block
    if (chapter.quote && chapter.quote.text) {
      if (cy > pageHeight - 45) {
        doc.addPage();
        currentPage++;
        addRunningHeaderFooter(`Chapter ${chapter.chapterNumber}`);
        cy = 26;
      }

      const quoteLines = doc.splitTextToSize(`"${chapter.quote.text}"`, contentWidth - 22);
      const quoteHeight = quoteLines.length * 5 + 12;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginX, cy, contentWidth, quoteHeight, 2, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.roundedRect(marginX, cy, contentWidth, quoteHeight, 2, 2, 'S');

      // Decorative Quote Bar
      doc.setFillColor(sr, sg, sb);
      doc.rect(marginX, cy, 3.5, quoteHeight, 'F');

      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text(quoteLines, marginX + 10, cy + 6.5);

      if (chapter.quote.attribution) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`— ${chapter.quote.attribution}`, marginX + 10, cy + quoteHeight - 3);
      }
      cy += quoteHeight + 8;
    }

    // Key Action Items / Bullet Points
    if (chapter.bulletPoints && chapter.bulletPoints.length > 0) {
      if (cy > pageHeight - 45) {
        doc.addPage();
        currentPage++;
        addRunningHeaderFooter(`Chapter ${chapter.chapterNumber}`);
        cy = 26;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(pr, pg, pb);
      doc.text('Key Action Items & Takeaways:', marginX, cy);
      cy += 6;

      chapter.bulletPoints.forEach((point) => {
        if (cy > pageHeight - 25) {
          doc.addPage();
          currentPage++;
          addRunningHeaderFooter(`Chapter ${chapter.chapterNumber}`);
          cy = 26;
        }

        // Bullet marker (square or circle)
        doc.setFillColor(ar, ag, ab);
        doc.rect(marginX + 1, cy - 2.8, 2.2, 2.2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const pointLines = doc.splitTextToSize(point, contentWidth - 8);
        doc.text(pointLines, marginX + 7, cy);
        cy += pointLines.length * 4.6 + 2.5;
      });
    }
  });

  return doc;
}

export function downloadBookPdf(book: Book): void {
  const doc = generateBookPdf(book);
  const cleanTitle = book.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  doc.save(`${cleanTitle}.pdf`);
}
