import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ValidationResponse } from "@shared/schema";

interface DataPreviewProps {
  validationResult: ValidationResponse;
}

export default function DataPreview({ validationResult }: DataPreviewProps) {
  if (!validationResult.preview || validationResult.preview.length === 0) {
    return null;
  }

  // Get the headers from the first row
  const headers = Object.keys(validationResult.preview[0]);

  // Create a map of row indices with errors
  const rowErrorMap = new Map<number, string[]>();
  validationResult.errors.forEach(error => {
    rowErrorMap.set(error.row, error.errors);
  });

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200 pb-3 mb-4">
        <h3 className="text-md font-medium text-gray-700">Data Preview</h3>
        <p className="text-sm text-gray-500">
          Review data before importing. Validation issues will be highlighted.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {validationResult.preview.map((row, rowIndex) => {
              const hasError = rowErrorMap.has(rowIndex);
              return (
                <TableRow 
                  key={rowIndex}
                  className={hasError ? "bg-red-50" : undefined}
                >
                  {headers.map((header) => (
                    <TableCell 
                      key={`${rowIndex}-${header}`}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        hasError 
                          ? "text-red-600" 
                          : header === "standardid" 
                            ? "font-medium text-gray-900" 
                            : "text-gray-500"
                      }`}
                    >
                      {row[header] === null ? '' : String(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {validationResult.errors.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          <Alert className="p-3 bg-red-50 text-red-700 rounded-md mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              <p className="font-medium">Validation issues found:</p>
              <ul className="list-disc pl-5 mt-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index}>
                    Row {error.row + 1}: {error.errors.join(", ")}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
