import JSZip from 'jszip';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import { Book } from '../types/book';

// ---------------------------------------------------------------------------
// 1. Markdown (.md) Generator
// ---------------------------------------------------------------------------
export function generateMarkdown(book: Book): string {
  let md = `---
title: "${book.title}"
subtitle: "${book.subtitle}"
author: "${book.author}"
date: "${book.createdAt}"
category: "${book.category}"
read_time: "${book.readTimeMinutes} mins"
tags: [${(book.tags || []).map((t) => `"${t}"`).join(', ')}]
---

# ${book.title}
## ${book.subtitle}
**By ${book.author}**

---

## 🎯 Strategic Demographic Persona (ICP)
- **Target Role:** ${book.persona?.targetRole || 'Industry Leader'}
- **Industry Sector:** ${book.persona?.industry || 'Business'}
- **Core Pain Point:** ${book.persona?.mainPainPoint || 'Operational friction'}
- **Target Transformation:** ${book.persona?.coreTransformation || 'Predictable scale'}
- **Ideal Audience Profile:** ${book.persona?.idealAudienceDescription || 'Senior Decision Makers'}

---

## 📚 Table of Contents
${(book.chapters || []).map((ch) => `- **Chapter ${ch.chapterNumber}:** ${ch.title} _(${ch.pillBadge})_`).join('\n')}

---

`;

  (book.chapters || []).forEach((ch) => {
    md += `## Chapter ${ch.chapterNumber}: ${ch.title}\n`;
    md += `*Badge: [${ch.pillBadge}]*\n\n`;
    md += `> **Executive Summary:** ${ch.summaryBox}\n\n`;

    (ch.subheadings || []).forEach((sub) => {
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

// ---------------------------------------------------------------------------
// 2. Plain Text (.txt) Generator
// ---------------------------------------------------------------------------
export function generatePlainText(book: Book): string {
  let txt = `================================================================================
${book.title.toUpperCase()}
${book.subtitle}
By: ${book.author}
Category: ${book.category} | Estimated Read Time: ${book.readTimeMinutes} minutes
================================================================================

TARGET DEMOGRAPHIC PERSONA:
--------------------------------------------------------------------------------
Role:           ${book.persona?.targetRole || 'Leader'}
Industry:       ${book.persona?.industry || 'Technology'}
Pain Point:     ${book.persona?.mainPainPoint || 'Execution'}
Transformation: ${book.persona?.coreTransformation || 'Growth'}
Profile:        ${book.persona?.idealAudienceDescription || 'Decision Maker'}

TABLE OF CONTENTS:
--------------------------------------------------------------------------------
${(book.chapters || []).map((ch) => `Chapter ${ch.chapterNumber}: ${ch.title} [${ch.pillBadge}]`).join('\n')}

================================================================================
`;

  (book.chapters || []).forEach((ch) => {
    txt += `\nCHAPTER ${ch.chapterNumber}: ${ch.title.toUpperCase()} [${ch.pillBadge}]
--------------------------------------------------------------------------------
EXECUTIVE SUMMARY:
${ch.summaryBox}

`;

    (ch.subheadings || []).forEach((sub) => {
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

// ---------------------------------------------------------------------------
// 3. EPUB (.epub) Generator (Industry Standard EPUB 3 Container)
// ---------------------------------------------------------------------------
export async function generateEpubBlob(book: Book): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (Must be first, uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. Stylesheet
  const css = `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif; line-height: 1.6; padding: 5%; color: #1c1917; }
h1 { font-size: 2em; margin-bottom: 0.2em; color: #0c0a09; }
h2 { font-size: 1.4em; margin-top: 1.5em; border-bottom: 1px solid #e7e5e4; padding-bottom: 0.3em; }
h3 { font-size: 1.15em; margin-top: 1.2em; color: #44403c; }
.subtitle { font-size: 1.1em; color: #78716c; margin-bottom: 1.5em; }
.author { font-size: 0.9em; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #a8a29e; }
.summary-box { background: #f5f5f4; border-left: 4px solid #78716c; padding: 1em; margin: 1.5em 0; font-style: italic; }
blockquote { border-left: 3px solid #d6d3d1; margin: 1.5em 0; padding-left: 1em; color: #57534e; font-style: italic; }
.badge { display: inline-block; background: #e7e5e4; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; margin-bottom: 0.5em; }
ul { padding-left: 1.5em; }
li { margin-bottom: 0.4em; }`;
  zip.file('OEBPS/style.css', css);

  // 4. Cover Page XHTML
  const coverHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(book.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body style="text-align: center; padding-top: 20%;">
  <div class="badge">${escapeXml(book.category || 'Executive Monograph')}</div>
  <h1>${escapeXml(book.title)}</h1>
  <p class="subtitle">${escapeXml(book.subtitle)}</p>
  <p class="author">By ${escapeXml(book.author)}</p>
  <p style="margin-top: 30%; font-size: 0.8em; color: #a8a29e;">PageCraft Publishing Studio</p>
</body>
</html>`;
  zip.file('OEBPS/cover.xhtml', coverHtml);

  // 5. Table of Contents & Persona XHTML
  const tocHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h2>Table of Contents</h2>
  <ul>
    ${(book.chapters || []).map((ch, idx) => `<li><a href="chapter_${idx + 1}.xhtml">Chapter ${ch.chapterNumber}: ${escapeXml(ch.title)}</a></li>`).join('\n')}
  </ul>

  <h2>Strategic Demographic Persona</h2>
  <div class="summary-box">
    <p><strong>Target Role:</strong> ${escapeXml(book.persona?.targetRole || '')}</p>
    <p><strong>Industry Sector:</strong> ${escapeXml(book.persona?.industry || '')}</p>
    <p><strong>Core Pain Point:</strong> ${escapeXml(book.persona?.mainPainPoint || '')}</p>
    <p><strong>Target Transformation:</strong> ${escapeXml(book.persona?.coreTransformation || '')}</p>
  </div>
</body>
</html>`;
  zip.file('OEBPS/toc.xhtml', tocHtml);

  // 6. Chapter Pages XHTML
  (book.chapters || []).forEach((ch, idx) => {
    const chHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Chapter ${ch.chapterNumber}: ${escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div class="badge">Chapter ${ch.chapterNumber} • ${escapeXml(ch.pillBadge)}</div>
  <h1>${escapeXml(ch.title)}</h1>
  
  <div class="summary-box">
    <strong>Executive Memorandum:</strong><br/>
    ${escapeXml(ch.summaryBox)}
  </div>

  ${(ch.subheadings || []).map((sub) => `<h3>${escapeXml(sub.title)}</h3><p>${escapeXml(sub.content).replace(/\n\n/g, '</p><p>')}</p>`).join('\n')}

  ${ch.quote?.text ? `<blockquote>"${escapeXml(ch.quote.text)}"<br/>— <em>${escapeXml(ch.quote.attribution)}</em></blockquote>` : ''}

  ${ch.bulletPoints?.length ? `<h3>Actionable Takeaways</h3><ul>${ch.bulletPoints.map((pt) => `<li>${escapeXml(pt)}</li>`).join('')}</ul>` : ''}
</body>
</html>`;
    zip.file(`OEBPS/chapter_${idx + 1}.xhtml`, chHtml);
  });

  // 7. NCX Navigation Map
  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${book.id}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${escapeXml(book.title)}</text></docTitle>
  <navMap>
    <navPoint id="nav-cover" playOrder="1">
      <navLabel><text>Cover</text></navLabel>
      <content src="cover.xhtml"/>
    </navPoint>
    <navPoint id="nav-toc" playOrder="2">
      <navLabel><text>Contents &amp; Persona</text></navLabel>
      <content src="toc.xhtml"/>
    </navPoint>
    ${(book.chapters || []).map((ch, idx) => `<navPoint id="nav-ch${idx + 1}" playOrder="${idx + 3}">
      <navLabel><text>Chapter ${ch.chapterNumber}: ${escapeXml(ch.title)}</text></navLabel>
      <content src="chapter_${idx + 1}.xhtml"/>
    </navPoint>`).join('\n')}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', ncx);

  // 8. OPF Package File
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(book.author)}</dc:creator>
    <dc:identifier id="BookID">${book.id}</dc:identifier>
    <dc:language>${book.language?.slice(0, 2).toLowerCase() || 'en'}</dc:language>
    <dc:date>${book.createdAt}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>
    ${(book.chapters || []).map((_, idx) => `<item id="ch${idx + 1}" href="chapter_${idx + 1}.xhtml" media-type="application/xhtml+xml"/>`).join('\n')}
  </manifest>
  <spine toc="ncx">
    <itemref idref="cover"/>
    <itemref idref="toc"/>
    ${(book.chapters || []).map((_, idx) => `<itemref idref="ch${idx + 1}"/>`).join('\n')}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', opf);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}

// ---------------------------------------------------------------------------
// 4. Microsoft Word (.docx) Document Generator
// ---------------------------------------------------------------------------
export async function generateDocxBlob(book: Book): Promise<Blob> {
  const sectionsChildren: Paragraph[] = [
    // Title
    new Paragraph({
      text: book.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
    }),
    new Paragraph({
      text: book.subtitle,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [
        new TextRun({
          text: `By ${book.author} · ${book.category || 'Strategic Monograph'}`,
          bold: true,
          color: '57534E',
        }),
      ],
    }),

    // Demographic ICP Box
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      text: 'Strategic Demographic Persona (ICP)',
      spacing: { before: 240, after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Target Role: ', bold: true }),
        new TextRun({ text: book.persona?.targetRole || 'Leader' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Industry Sector: ', bold: true }),
        new TextRun({ text: book.persona?.industry || 'Technology' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Core Pain Point: ', bold: true }),
        new TextRun({ text: book.persona?.mainPainPoint || 'Scaling bottlenecks' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Target Transformation: ', bold: true }),
        new TextRun({ text: book.persona?.coreTransformation || 'Predictable leverage', italics: true }),
      ],
      spacing: { after: 360 },
    }),
  ];

  // Chapters
  (book.chapters || []).forEach((ch) => {
    sectionsChildren.push(
      new Paragraph({
        text: `Chapter ${ch.chapterNumber}: ${ch.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `[Stage: ${ch.pillBadge}]`,
            bold: true,
            color: '78716C',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 120, after: 200 },
        children: [
          new TextRun({ text: 'Executive Summary: ', bold: true }),
          new TextRun({ text: ch.summaryBox, italics: true }),
        ],
      })
    );

    (ch.subheadings || []).forEach((sub) => {
      sectionsChildren.push(
        new Paragraph({
          text: sub.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
        }),
        new Paragraph({
          text: sub.content,
          spacing: { after: 160 },
        })
      );
    });

    if (ch.quote?.text) {
      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 160, after: 160 },
          children: [
            new TextRun({ text: `"${ch.quote.text}"`, italics: true, bold: true, color: '44403C' }),
            new TextRun({ text: ` — ${ch.quote.attribution}`, color: '78716C' }),
          ],
        })
      );
    }

    if (ch.bulletPoints?.length) {
      sectionsChildren.push(
        new Paragraph({
          text: 'Actionable Takeaways',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );

      ch.bulletPoints.forEach((point) => {
        sectionsChildren.push(
          new Paragraph({
            text: `• ${point}`,
            spacing: { after: 60 },
          })
        );
      });
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: sectionsChildren,
      },
    ],
  });

  return Packer.toBlob(doc);
}

// ---------------------------------------------------------------------------
// Helpers & Download Launchers
// ---------------------------------------------------------------------------
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadFile(content: string | Blob, filename: string, mimeType?: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType || 'text/plain' }) : content;
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

export async function downloadEpub(book: Book) {
  const blob = await generateEpubBlob(book);
  const cleanTitle = book.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  downloadFile(blob, `${cleanTitle}.epub`);
}

export async function downloadDocx(book: Book) {
  const blob = await generateDocxBlob(book);
  const cleanTitle = book.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  downloadFile(blob, `${cleanTitle}.docx`);
}
