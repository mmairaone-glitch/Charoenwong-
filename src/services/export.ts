import * as XLSX from 'xlsx';

export interface ExportData {
  filename: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number)[][];
}

// Export as CSV
export function exportToCSV({ filename, headers, rows }: ExportData) {
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export as Excel (.xlsx) using SheetJS XLSX
export function exportToExcel({ filename, sheetName = 'Sheet1', headers, rows }: ExportData) {
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    rows.forEach((row) => {
      const len = String(row[i] ?? '').length;
      if (len > maxLen) maxLen = len;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Print / PDF format view trigger
export function printReport(title: string, headers: string[], rows: (string | number)[][]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; padding: 20px; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 20px; color: #0f172a; }
          .meta { font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #0f766e; color: white; padding: 8px 10px; text-align: left; font-weight: 600; border: 1px solid #0f766e; }
          td { padding: 6px 10px; border: 1px solid #cbd5e1; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; }
          .badge-ok { background: #dcfce7; color: #15803d; }
          .badge-due { background: #fef9c3; color: #854d0e; }
          .badge-overdue { background: #fee2e2; color: #b91c1c; }
          .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>PCS-NISSIN METROLOGY</h1>
            <div style="font-size: 14px; font-weight: 600; color: #0f766e; margin-top: 4px;">${title}</div>
          </div>
          <div class="meta">
            <div>Printed Date: ${new Date().toLocaleString()}</div>
            <div>Total Records: ${rows.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr>
                ${row.map((cell) => `<td>${cell ?? ''}</td>`).join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>QA/QC Metrology & Calibration Department - Official Control Record</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
