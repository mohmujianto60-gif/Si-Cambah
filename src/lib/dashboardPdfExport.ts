import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { HibahStats } from './hibahService';
import { KATEGORI_LABELS, type KategoriHibah } from '../types/hibah';

interface ExportOptions {
  /** Optional: filter to a single year. If omitted, export covers all years. */
  year?: number;
  /** App user (printed in header for traceability). */
  userName?: string;
  /** App user role. */
  userRole?: string;
}

function todayId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function formatDateIndonesian(date: Date = new Date()): string {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Render a multi-section PDF rekap of dashboard statistics:
 * 1. Title + metadata (period, generated-by, generated-at)
 * 2. Ringkasan utama (total, kategori aktif, tahun tercatat)
 * 3. Per-kategori breakdown table
 * 4. Per-tahun breakdown table
 *
 * The PDF is auto-downloaded with a sensible filename.
 */
export function exportDashboardPdf(
  stats: HibahStats,
  availableYears: number[],
  options: ExportOptions = {},
): void {
  const { year, userName, userRole } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 118, 110);
  doc.text('Rekap Si-CAMBAH', margin, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text('Catatan & Manajemen Hibah Bapperida', margin, 66);

  // Metadata
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const meta: string[] = [
    `Periode: ${year ? `Tahun ${year}` : 'Semua tahun'}`,
    `Dicetak: ${formatDateIndonesian()}`,
  ];
  if (userName) meta.push(`Oleh: ${userName}${userRole ? ` (${userRole})` : ''}`);
  doc.text(meta, pageWidth - margin, 50, { align: 'right' });

  // Separator
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, 90, pageWidth - margin, 90);

  // Section 1: Ringkasan utama
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text('Ringkasan Utama', margin, 115);

  const summaryY = 130;
  const cardWidth = (pageWidth - margin * 2 - 20) / 3;
  const cardHeight = 60;

  const summaryCards: { label: string; value: string | number }[] = [
    { label: 'Total data', value: stats.total },
    { label: 'Kategori aktif', value: Object.keys(stats.byKategori).length },
    { label: 'Tahun tercatat', value: availableYears.length },
  ];

  summaryCards.forEach((card, i) => {
    const x = margin + i * (cardWidth + 10);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(x, summaryY, cardWidth, cardHeight, 6, 6, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(card.label, x + 12, summaryY + 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 118, 110);
    doc.text(String(card.value), x + 12, summaryY + 48);
  });

  // Section 2: Per kategori
  const tableStartY = summaryY + cardHeight + 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text(
    year ? `Distribusi per Kategori (${year})` : 'Distribusi per Kategori',
    margin,
    tableStartY,
  );

  const kategoriRows: [string, number, string][] = [];
  const kategoriEntries = (
    Object.entries(stats.byKategori) as [KategoriHibah, number][]
  )
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  // If year is selected, use year-filtered data
  let totalForKategori = stats.total;
  let entriesToUse: [KategoriHibah, number][] = kategoriEntries;
  if (year) {
    entriesToUse = (
      Object.entries(stats.byKategori) as [KategoriHibah, number][]
    )
      .map(([kat]): [KategoriHibah, number] => {
        const v = stats.byKategoriTahun?.[kat]?.[year] || 0;
        return [kat, v];
      })
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    totalForKategori = entriesToUse.reduce((sum, [, c]) => sum + c, 0);
  }

  for (const [kat, count] of entriesToUse) {
    const pct =
      totalForKategori > 0
        ? ((count / totalForKategori) * 100).toFixed(1)
        : '0.0';
    kategoriRows.push([
      KATEGORI_LABELS[kat] ?? kat,
      count,
      `${pct}%`,
    ]);
  }
  // Total row
  kategoriRows.push(['Total', totalForKategori, '100.0%']);

  autoTable(doc, {
    startY: tableStartY + 10,
    head: [['Kategori', 'Jumlah', 'Persentase']],
    body: kategoriRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      1: { halign: 'right', cellWidth: 80 },
      2: { halign: 'right', cellWidth: 80 },
    },
    didParseCell: (data) => {
      if (data.row.index === kategoriRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
  });

  // Section 3: Per tahun (only when not filtered to a single year)
  if (!year) {
    const lastY =
      (doc as unknown as { lastAutoTable?: { finalY: number } })
        .lastAutoTable?.finalY ?? tableStartY + 80;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text('Tren per Tahun', margin, lastY + 30);

    const tahunRows: [string, number, string][] = [];
    const tahunEntries = Object.entries(stats.byTahun ?? {})
      .map(([t, c]) => [Number(t), Number(c)] as [number, number])
      .filter(([, c]) => c > 0)
      .sort((a, b) => a[0] - b[0]);

    const grandTotal = tahunEntries.reduce((sum, [, c]) => sum + c, 0);
    for (const [t, count] of tahunEntries) {
      const pct =
        grandTotal > 0 ? ((count / grandTotal) * 100).toFixed(1) : '0.0';
      tahunRows.push([String(t), count, `${pct}%`]);
    }
    tahunRows.push(['Total', grandTotal, '100.0%']);

    autoTable(doc, {
      startY: lastY + 40,
      head: [['Tahun', 'Jumlah', 'Persentase']],
      body: tahunRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: {
        fillColor: [15, 118, 110],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        1: { halign: 'right', cellWidth: 80 },
        2: { halign: 'right', cellWidth: 80 },
      },
      didParseCell: (data) => {
        if (data.row.index === tahunRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
    });
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Si-CAMBAH — halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'center' },
    );
  }

  const filename = year
    ? `Rekap-Si-CAMBAH-${year}-${todayId()}.pdf`
    : `Rekap-Si-CAMBAH-${todayId()}.pdf`;
  doc.save(filename);
}
