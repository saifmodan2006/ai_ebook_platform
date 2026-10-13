import { Book } from '../types/book';

export function generateMarkdown(book: Book): string {
  let md = `---
title: "${book.title}"
subtitle: "${book.subtitle}"
author: "${book.author}"
date: "${book.createdAt}"
category: "${book.category}"
read_time: "${book.readTimeMinutes} mins"
tags: [${book.tags.map((t) => `"${t}"`).join(', ')}]
---

# ${book.title}
## ${book.subtitle}
**By ${book.author}**

---

## 🎯 Strategic Demographic Persona (ICP)
- **Target Role:** ${book.persona.targetRole}
- **Industry Sector:** ${book.persona.industry}
- **Core Pain Point:** ${book.persona.mainPainPoint}
- **Target Transformation:** ${book.persona.coreTransformation}
- **Ideal Audience Profile:** ${book.persona.idealAudienceDescription}

---

## 📚 Table of Contents
${book.chapters.map((ch) => `- **Chapter ${ch.chapterNumber}:** ${ch.title} _(${ch.pillBadge})_`).join('\n')}

---

`;

  book.chapters.forEach((ch) => {
    md += `## Chapter ${ch.chapterNumber}: ${ch.title}\n`;
    md += `*Badge: [${ch.pillBadge}]*\n\n`;
    md += `> **Executive Summary:** ${ch.summaryBox}\n\n`;

    ch.subheadings.forEach((sub) => {
      md += `### ${sub.title}\n\n`;
      md += `${sub.content}\n\n`;
    });

    if (ch.quote?.text) {
      md += `> "${ch.quote.text}"\n> — *${ch.quote.attribution}*\n\n`;
    }

    if (ch.bulletPoints?.length) {
      md += `#### Key Action Items & Takeaways\n`;
      ch.bulletPoints.forEach((point) => {
        md += `- ${point}\n`;
      });
      md += '\n';
    }

    md += `---\n\n`;
  });

  return md;
}

export function generatePlainText(book: Book): string {
  let txt = `================================================================================
${book.title.toUpperCase()}
${book.subtitle}
By: ${book.author}
Category: ${book.category} | Estimated Read Time: ${book.readTimeMinutes} minutes
================================================================================

TARGET DEMOGRAPHIC PERSONA:
--------------------------------------------------------------------------------
Role:           ${book.persona.targetRole}
Industry:       ${book.persona.industry}
Pain Point:     ${book.persona.mainPainPoint}
Transformation: ${book.persona.coreTransformation}
Profile:        ${book.persona.idealAudienceDescription}

TABLE OF CONTENTS:
--------------------------------------------------------------------------------
${book.chapters.map((ch) => `Chapter ${ch.chapterNumber}: ${ch.title} [${ch.pillBadge}]`).join('\n')}

================================================================================
`;

  book.chapters.forEach((ch) => {
    txt += `\nCHAPTER ${ch.chapterNumber}: ${ch.title.toUpperCase()} [${ch.pillBadge}]
--------------------------------------------------------------------------------
EXECUTIVE SUMMARY:
${ch.summaryBox}

`;

    ch.subheadings.forEach((sub) => {
      txt += `${sub.title.toUpperCase()}\n`;
      txt += `${sub.content}\n\n`;
    });

    if (ch.quote?.text) {
      txt += `PULL QUOTE:\n"${ch.quote.text}"\n— ${ch.quote.attribution}\n\n`;
    }

    if (ch.bulletPoints?.length) {
      txt += `ACTIONABLE TAKEAWAYS:\n`;
      ch.bulletPoints.forEach((point, idx) => {
        txt += ` ${idx + 1}. ${point}\n`;
      });
      txt += '\n';
    }

    txt += `--------------------------------------------------------------------------------\n`;
  });

  return txt;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(book: Book) {
  const md = generateMarkdown(book);
  const cleanTitle = book.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  downloadFile(md, `${cleanTitle}.md`, 'text/markdown;charset=utf-8');
}

export function downloadPlainText(book: Book) {
  const txt = generatePlainText(book);
  const cleanTitle = book.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  downloadFile(txt, `${cleanTitle}.txt`, 'text/plain;charset=utf-8');
}

export function downloadJsonBackup(book: Book) {
  const jsonStr = JSON.stringify(book, null, 2);
  const cleanTitle = book.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  downloadFile(jsonStr, `${cleanTitle}-backup.json`, 'application/json;charset=utf-8');
}
