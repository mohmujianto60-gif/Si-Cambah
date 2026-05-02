import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Hibah } from '../types/hibah';

interface ColumnDef {
  key: string;
  label: string;
}

export function downloadTemplate(columns: ColumnDef[], filename: string) {
  const allCols = [...columns];
  if (!allCols.some((c) => c.key === 'keterangan')) {
    allCols.push({ key: 'keterangan', label: 'Keterangan' });
  }
  const headers = allCols.map((c) => c.label);
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 5, 15) }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, `Template_${filename}.xlsx`);
}

export function exportToExcel(data: Hibah[], columns: ColumnDef[], filename: string) {
  const rows = data.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const col of columns) {
      obj[col.label] = (row as unknown as Record<string, unknown>)[col.key] ?? '';
    }
    obj['Status'] = row.status === 'confirmed' ? 'Dikonfirmasi' : 'Draft';
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = [...columns.map((c) => ({ wch: Math.max(c.label.length + 5, 15) })), { wch: 15 }];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToPDF(data: Hibah[], columns: ColumnDef[], title: string, filename: string) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
  doc.text(`Total: ${data.length} data`, 14, 34);

  const head = [...columns.map((c) => c.label), 'Status'];
  const body = data.map((row) => [
    ...columns.map((col) => String((row as unknown as Record<string, unknown>)[col.key] ?? '')),
    row.status === 'confirmed' ? 'Dikonfirmasi' : 'Draft',
  ]);

  autoTable(doc, {
    startY: 40,
    head: [head],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
