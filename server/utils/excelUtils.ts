import ExcelJS from 'exceljs';
import { type Record } from '@shared/schema';

// Parse Excel file to JSON
export async function parseExcelToJson(buffer: Buffer): Promise<any[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.getWorksheet(1); // Get first worksheet
  
  if (!worksheet) {
    throw new Error('Worksheet not found in Excel file');
  }
  
  const jsonData: any[] = [];
  
  // Get headers from the first row
  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell) => {
    headers.push(cell.value?.toString() || '');
  });
  
  // Process data rows (skip header row)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      const rowData: any = {};
      
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        
        if (header) {
          // Handle different cell types
          if (cell.value) {
            if (header === 'tanggal' && cell.value instanceof Date) {
              // Format date as YYYY-MM-DD
              const date = cell.value;
              rowData[header] = date.toISOString().split('T')[0];
            } else if (typeof cell.value === 'object' && cell.value !== null && 'text' in cell.value) {
              // Handle rich text
              rowData[header] = cell.value.text;
            } else {
              // Handle other types
              rowData[header] = cell.value;
            }
          } else {
            rowData[header] = null;
          }
        }
      });
      
      jsonData.push(rowData);
    }
  });
  
  return jsonData;
}

// Format data for Excel export
export function formatDataForExcel(records: Record[], columns: string[]): { headers: string[]; rows: any[][] } {
  // Filter columns to only include those that exist in the records
  const validColumns = columns.filter(col => 
    records.length === 0 || col in records[0]
  );
  
  // Map records to rows
  const rows = records.map(record => {
    return validColumns.map(col => {
      // Handle different column types
      if (col === 'tanggal' && record[col] instanceof Date) {
        return record[col].toISOString().split('T')[0];
      } else if (col === 'created_at' || col === 'updated_at') {
        return record[col] ? new Date(record[col]).toISOString() : null;
      } else {
        return record[col];
      }
    });
  });
  
  return {
    headers: validColumns,
    rows,
  };
}

// Filter records by date range
export function filterRecordsByDateRange(records: Record[], startDate?: string, endDate?: string): Record[] {
  if (!startDate && !endDate) {
    return records;
  }
  
  let filteredRecords = [...records];
  
  if (startDate) {
    const start = new Date(startDate);
    filteredRecords = filteredRecords.filter(record => {
      const recordDate = new Date(record.tanggal);
      return recordDate >= start;
    });
  }
  
  if (endDate) {
    const end = new Date(endDate);
    filteredRecords = filteredRecords.filter(record => {
      const recordDate = new Date(record.tanggal);
      return recordDate <= end;
    });
  }
  
  return filteredRecords;
}
