import jsPDF from 'jspdf';

const BRAND_INDIGO = [99, 102, 241];
const BRAND_CYAN   = [0, 212, 255];
const DARK_BG      = [13, 13, 34];
const LIGHT_TEXT   = [240, 244, 255];
const MUTED_TEXT   = [100, 120, 160];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export const generateAssessmentReport = async (assessment) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  let y = 0;

  // ── Page 1: Header ──────────────────────────────────────────────
  pdf.setFillColor(...DARK_BG);
  pdf.rect(0, 0, W, 55, 'F');

  // Gradient band (simulated with layers)
  pdf.setFillColor(...BRAND_INDIGO);
  pdf.rect(0, 0, W * 0.6, 3, 'F');
  pdf.setFillColor(...BRAND_CYAN);
  pdf.rect(W * 0.6, 0, W * 0.4, 3, 'F');

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(...LIGHT_TEXT);
  pdf.text('MindEase', 20, 22);

  pdf.setFontSize(11);
  pdf.setTextColor(...MUTED_TEXT);
  pdf.text('AI Mental Wellness Platform', 20, 30);

  pdf.setFontSize(9);
  pdf.text(`Report generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 20, 38);
  pdf.text(`User: ${assessment.userEmail || 'Anonymous'}`, 20, 44);

  // Right badge
  const score = assessment.wellnessIndex || 0;
  const scoreColor = score >= 70 ? [16, 185, 129] : score >= 45 ? [245, 158, 11] : [244, 63, 94];
  pdf.setFillColor(...scoreColor);
  pdf.roundedRect(W - 50, 10, 35, 35, 5, 5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`${score}`, W - 32.5, 30, { align: 'center' });
  pdf.setFontSize(7);
  pdf.text('/ 100', W - 32.5, 37, { align: 'center' });

  y = 65;

  // ── Assessment Overview ─────────────────────────────────────────
  pdf.setFillColor(20, 20, 45);
  pdf.roundedRect(15, y, W - 30, 32, 4, 4, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(...LIGHT_TEXT);
  pdf.text(assessment.categoryName || 'Assessment', 22, y + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...MUTED_TEXT);
  pdf.text(`Wellness Level: ${assessment.wellnessLevel || '—'}`, 22, y + 19);
  pdf.text(`Completed: ${new Date(assessment.date).toLocaleDateString('en-IN')}`, 22, y + 27);

  y += 42;

  // ── Individual Test Results ─────────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...BRAND_CYAN);
  pdf.text('Individual Test Results', 15, y);
  y += 8;

  (assessment.testResults || []).forEach((test) => {
    if (y > H - 60) { pdf.addPage(); y = 20; }

    const pct = Math.round((test.score / test.maxScore) * 100);
    const barColor = pct >= 60 ? [16, 185, 129] : pct >= 35 ? [245, 158, 11] : [244, 63, 94];

    pdf.setFillColor(18, 18, 40);
    pdf.roundedRect(15, y, W - 30, 22, 3, 3, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...LIGHT_TEXT);
    pdf.text(test.testName, 20, y + 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...MUTED_TEXT);
    pdf.text(`${test.score}/${test.maxScore} · ${test.severity}`, 20, y + 15);

    // Progress bar background
    pdf.setFillColor(30, 30, 55);
    pdf.roundedRect(W - 70, y + 8, 55, 5, 2, 2, 'F');
    // Progress bar fill
    pdf.setFillColor(...barColor);
    pdf.roundedRect(W - 70, y + 8, Math.max(2, 55 * pct / 100), 5, 2, 2, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...barColor);
    pdf.text(`${pct}%`, W - 12, y + 13, { align: 'right' });

    y += 26;
  });

  // ── Recommendations ─────────────────────────────────────────────
  if (y > H - 80) { pdf.addPage(); y = 20; }

  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...BRAND_CYAN);
  pdf.text('Personalized Recommendations', 15, y);
  y += 8;

  (assessment.suggestions || []).forEach((s, i) => {
    if (y > H - 30) { pdf.addPage(); y = 20; }

    pdf.setFillColor(18, 18, 40);
    const lines = pdf.splitTextToSize(s, W - 50);
    const boxH  = 8 + lines.length * 5;
    pdf.roundedRect(15, y, W - 30, boxH, 3, 3, 'F');

    pdf.setFillColor(...BRAND_INDIGO);
    pdf.roundedRect(20, y + 5, 6, 6, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(String(i + 1), 23, y + 9.5, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...MUTED_TEXT);
    pdf.text(lines, 30, y + 9);

    y += boxH + 4;
  });

  // ── Footer (every page) ─────────────────────────────────────────
  const pageCount = pdf.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p);
    pdf.setFillColor(8, 8, 20);
    pdf.rect(0, H - 12, W, 12, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...MUTED_TEXT);
    pdf.text('Not a substitute for professional medical advice  ·  MindEase AI © 2025  ·  Crafted by Devansh Gupta & Team', W / 2, H - 5, { align: 'center' });
    pdf.text(`Page ${p} / ${pageCount}`, W - 15, H - 5, { align: 'right' });
  }

  return pdf;
};

export const downloadPDF = async (assessment) => {
  const pdf = await generateAssessmentReport(assessment);
  const name = `MindEase_${assessment.category || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(name);
};
