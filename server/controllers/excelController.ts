import ExcelJS from 'exceljs';
import { storage } from '../storage';
import { excelRowSchema, type ExcelRow, type InsertRecord } from '@shared/schema';
import { parseExcelToJson, formatDataForExcel } from '../utils/excelUtils';

// Export data to Excel
export async function exportToExcel(columns: string[], startDate?: string, endDate?: string): Promise<Buffer> {
  // Fetch records from storage with optional date filtering
  const records = await storage.getRecordsByDateRange(startDate, endDate);
  
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');
  
  // Format the data for Excel
  const { headers, rows } = formatDataForExcel(records, columns);
  
  // Add headers to the worksheet
  worksheet.addRow(headers);
  
  // Style the header row
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4B82F6' }, // Primary color
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
  });
  
  // Add data rows
  rows.forEach(row => {
    worksheet.addRow(row);
  });
  
  // Auto-adjust column widths
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2;
  });
  
  // Return as buffer
  return await workbook.xlsx.writeBuffer();
}

// Generate Excel template for import
export async function generateTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template');
  
  // Define headers
  const headers = ['standardid', 'tanggal', 'actual', 'kategori', 'status', 'keterangan'];
  
  // Add headers to the worksheet
  worksheet.addRow(headers);
  
  // Style the header row
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4B82F6' }, // Primary color
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
  });
  
  // Add example data for reference
  worksheet.addRow(['STD-001', '2023-05-01', '95.5', 'A', 'Active', 'Sample data entry']);
  
  // Add instructions sheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.addRow(['Import Instructions']);
  instructionsSheet.getRow(1).font = { bold: true, size: 14 };
  
  instructionsSheet.addRow(['']);
  instructionsSheet.addRow(['Please follow these guidelines when filling the template:']);
  instructionsSheet.addRow(['1. standardid: A unique identifier for each record (e.g., STD-001, STD-002)']);
  instructionsSheet.addRow(['2. tanggal: Date in YYYY-MM-DD format (e.g., 2023-05-01)']);
  instructionsSheet.addRow(['3. actual: The actual value (can be text or numeric)']);
  instructionsSheet.addRow(['4. kategori: Category classification (e.g., A, B, C)']);
  instructionsSheet.addRow(['5. status: Current status (e.g., Active, Pending, Completed)']);
  instructionsSheet.addRow(['6. keterangan: Optional notes or comments']);
  
  // Set column widths
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  
  instructionsSheet.getColumn(1).width = 100;
  
  return await workbook.xlsx.writeBuffer();
}

// Validate Excel file before import
export async function validateExcelFile(fileBuffer: Buffer): Promise<any> {
  try {
    const jsonData = await parseExcelToJson(fileBuffer);
    
    // Initialize validation response
    const validationResponse = {
      valid: true,
      errors: [] as { row: number; errors: string[] }[],
      preview: jsonData.slice(0, 10), // Return first 10 rows for preview
    };
    
    // Check for empty file
    if (jsonData.length === 0) {
      validationResponse.valid = false;
      validationResponse.errors.push({
        row: 0,
        errors: ['File is empty. Please upload a file with data.'],
      });
      return validationResponse;
    }
    
    // Track standardids to check for duplicates
    const existingStandardIds = new Set<string>();
    const fileStandardIds = new Set<string>();
    
    // Get existing standardids from database
    const existingRecords = await storage.getAllRecords();
    existingRecords.forEach(record => {
      existingStandardIds.add(record.standardid);
    });
    
    // Validate each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowErrors: string[] = [];
      
      // Validate using zod schema
      const validation = excelRowSchema.safeParse(row);
      
      if (!validation.success) {
        validation.error.errors.forEach(err => {
          rowErrors.push(`${err.path[0]}: ${err.message}`);
        });
      }
      
      // Check for duplicate standardids within the file
      if (row.standardid) {
        if (fileStandardIds.has(row.standardid)) {
          rowErrors.push(`Duplicate standardid '${row.standardid}' within the file.`);
        } else {
          fileStandardIds.add(row.standardid);
        }
        
        // Check if standardid already exists in database
        if (existingStandardIds.has(row.standardid)) {
          rowErrors.push(`standardid '${row.standardid}' already exists in the database.`);
        }
      }
      
      // Add row errors if any
      if (rowErrors.length > 0) {
        validationResponse.valid = false;
        validationResponse.errors.push({
          row: i,
          errors: rowErrors,
        });
      }
    }
    
    return validationResponse;
  } catch (error) {
    console.error('Error validating Excel file:', error);
    throw new Error('Error validating Excel file. Please check the file format.');
  }
}

// Import data from Excel file
export async function importFromExcel(fileBuffer: Buffer): Promise<{ imported: number; errors: number }> {
  try {
    const jsonData = await parseExcelToJson(fileBuffer);
    const validRecords: InsertRecord[] = [];
    let errors = 0;
    
    // Process each row
    for (const row of jsonData) {
      // Validate the row
      const validation = excelRowSchema.safeParse(row);
      
      if (validation.success) {
        const validatedRow = validation.data;
        
        // Check if standardid already exists
        const existingRecord = await storage.getRecordByStandardId(validatedRow.standardid);
        
        if (!existingRecord) {
          // Convert to InsertRecord format
          const insertRecord: InsertRecord = {
            standardid: validatedRow.standardid,
            tanggal: new Date(validatedRow.tanggal),
            actual: validatedRow.actual,
            kategori: validatedRow.kategori,
            status: validatedRow.status,
            keterangan: validatedRow.keterangan,
          };
          
          validRecords.push(insertRecord);
        } else {
          errors++;
        }
      } else {
        errors++;
      }
    }
    
    // Import valid records
    if (validRecords.length > 0) {
      await storage.createManyRecords(validRecords);
    }
    
    return {
      imported: validRecords.length,
      errors,
    };
  } catch (error) {
    console.error('Error importing from Excel:', error);
    throw new Error('Error importing from Excel. Please check the file format.');
  }
}
