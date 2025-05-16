import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { 
  exportToExcel, 
  validateExcelFile, 
  importFromExcel,
  generateTemplate
} from "./controllers/excelController";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept only Excel files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'));
      return;
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes for Excel import/export functionality
  
  // Get all records
  app.get('/api/records', async (req, res) => {
    try {
      const records = await storage.getAllRecords();
      res.json(records);
    } catch (error) {
      console.error('Error fetching records:', error);
      res.status(500).json({ message: 'Error fetching records' });
    }
  });

  // Create a new record
  app.post('/api/records', async (req, res) => {
    try {
      const record = await storage.createRecord(req.body);
      res.status(201).json(record);
    } catch (error) {
      console.error('Error creating record:', error);
      res.status(500).json({ message: 'Error creating record' });
    }
  });

  // Export records to Excel
  app.post('/api/excel/export', async (req, res) => {
    try {
      const { columns, startDate, endDate } = req.body;
      const buffer = await exportToExcel(columns, startDate, endDate);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="exported_data.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      res.status(500).json({ message: 'Error exporting to Excel' });
    }
  });

  // Download Excel template
  app.get('/api/excel/template', async (_req, res) => {
    try {
      const buffer = await generateTemplate();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="import_template.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({ message: 'Error generating template' });
    }
  });

  // Validate Excel file before import
  app.post('/api/excel/validate', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const validationResult = await validateExcelFile(req.file.buffer);
      res.json(validationResult);
    } catch (error) {
      console.error('Error validating Excel file:', error);
      res.status(500).json({ message: 'Error validating Excel file' });
    }
  });

  // Import data from Excel file
  app.post('/api/excel/import', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const importResult = await importFromExcel(req.file.buffer);
      res.json(importResult);
    } catch (error) {
      console.error('Error importing from Excel:', error);
      res.status(500).json({ message: 'Error importing from Excel' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
