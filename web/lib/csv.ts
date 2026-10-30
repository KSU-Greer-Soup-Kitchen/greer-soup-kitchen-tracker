// Builds a spreadsheet (CSV) file. Cells that start with = + - @ get a leading
// apostrophe so a spreadsheet never runs them as a formula.

function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(header: string[], rows: string[][]): string {
  // The BOM at the start tells Excel the file is UTF-8
  return "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
