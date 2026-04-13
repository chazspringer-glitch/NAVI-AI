/**
 * exportToPDF — prints an HTML string as a PDF without opening a popup window.
 *
 * Uses a hidden iframe injected into the current page so the print dialog
 * opens directly. This avoids popup blockers on mobile (iOS Safari, Android
 * Chrome) that block window.open() calls made outside of a direct user tap.
 *
 * Falls back to window.open() if the iframe approach fails (very old browsers).
 *
 * @param {string} html  Full <!DOCTYPE html> ... </html> string to print
 */
export function exportToPDF(html) {
  try {
    const iframe = document.createElement("iframe");
    // Keep the iframe off-screen and invisible
    iframe.style.cssText =
      "position:fixed;right:-9999px;top:-9999px;width:1px;height:1px;opacity:0;border:0;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) throw new Error("no contentDocument");

    doc.open();
    doc.write(html);
    doc.close();

    // Give the browser time to parse styles before opening the print dialog
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        // If contentWindow.print() throws (e.g. cross-origin edge case), fall back
        fallbackPrint(html);
      }
      // Clean up the iframe after the dialog has had time to open
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2500);
    }, 400);
  } catch {
    fallbackPrint(html);
  }
}

function fallbackPrint(html) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 300);
}

// ── Shared print CSS injected into every exported document ────────────────────
export const PRINT_CSS = `
  /* Reset */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* Page setup */
  @page {
    size: letter portrait;
    margin: 0.9in 0.85in;
  }

  /* Base */
  body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 13.5px;
    color: #111;
    line-height: 1.65;
    max-width: 680px;
    margin: 0 auto;
    padding: 36px 28px;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Headings */
  h1 {
    font-size: 24px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: #000;
    margin-bottom: 3px;
  }
  h2 {
    font-size: 18px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #222;
    margin-bottom: 4px;
  }

  /* Sections */
  .section {
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  .section-title {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #777;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
    margin-bottom: 9px;
    page-break-after: avoid;
  }

  /* Text */
  p  { color: #333; margin-bottom: 4px; }
  ul { padding-left: 18px; }
  ol { padding-left: 20px; }
  li { margin-bottom: 4px; color: #333; }

  /* Pill-style skill tags */
  .skill-tag {
    display: inline-block;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 1px 7px;
    font-size: 11.5px;
    margin: 2px 3px 2px 0;
  }

  /* Footer */
  .footer {
    margin-top: 36px;
    font-size: 9px;
    color: #bbb;
    text-align: center;
    border-top: 1px solid #eee;
    padding-top: 10px;
    page-break-before: avoid;
  }

  /* Screen-only padding; removed when printing */
  @media screen {
    body { padding: 48px 40px; }
  }
  @media print {
    body { padding: 0; }
  }
`;
