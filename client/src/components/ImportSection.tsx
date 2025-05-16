import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileDown, FileUp, Loader2 } from "lucide-react";
import { validateExcelFile, importExcelData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { downloadExcelTemplate } from "@/lib/api";
import DataPreview from "./DataPreview";
import ImportProgressModal from "./ImportProgressModal";
import { ValidationResponse } from "@shared/schema";

interface ImportSectionProps {
  showAlert: (message: string, type: "success" | "error") => void;
}

export default function ImportSection({ showAlert }: ImportSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDownloadTemplate = async () => {
    try {
      await downloadExcelTemplate();
      toast({
        title: "Template Downloaded",
        description: "Excel template has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile) return;

    if (
      uploadedFile.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      toast({
        title: "Invalid File",
        description: "Please upload a valid Excel (.xlsx) file.",
        variant: "destructive",
      });
      return;
    }

    setFile(uploadedFile);
    await validateFile(uploadedFile);
  };

  const validateFile = async (fileToValidate: File) => {
    try {
      setIsValidating(true);
      const formData = new FormData();
      formData.append("file", fileToValidate);

      const result = await validateExcelFile(formData);
      setValidationResult(result);

      if (!result.valid) {
        showAlert(
          `Validation found ${result.errors.length} issues. Please review before importing.`,
          "error"
        );
      } else {
        showAlert("File validation successful. You can now import the data.", "success");
      }
    } catch (error) {
      console.error("Validation error:", error);
      showAlert("Error validating file. Please try again.", "error");
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file || !validationResult) return;

    try {
      setIsImporting(true);
      setShowProgressModal(true);
      
      // Simulate progress updates
      const interval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      const formData = new FormData();
      formData.append("file", file);

      const result = await importExcelData(formData);
      clearInterval(interval);
      setImportProgress(100);

      setTimeout(() => {
        setShowProgressModal(false);
        setIsImporting(false);
        showAlert(
          `Import completed successfully! ${result.imported} records were imported${
            result.errors > 0 ? `, ${result.errors} records had validation errors.` : "."
          }`,
          "success"
        );
        resetForm();
      }, 500);
    } catch (error) {
      console.error("Import error:", error);
      setShowProgressModal(false);
      setIsImporting(false);
      showAlert("Import failed. Please try again.", "error");
    }
  };

  const resetForm = () => {
    setFile(null);
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Import Data</h2>
          <p className="text-sm text-gray-500 mb-6">
            Upload Excel file (.xlsx) to import data. Please ensure your data follows the required format.
          </p>

          <div className="mb-6">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="flex items-center"
            >
              <FileDown className="h-5 w-5 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 block mb-2">
              Upload Excel File
            </Label>
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <Label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/90"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx"
                      onChange={handleInputChange}
                      ref={fileInputRef}
                    />
                  </Label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  Excel files (.xlsx) up to 5MB
                </p>
              </div>
            </div>
            
            {file && (
              <div className="mt-2">
                <div className="flex items-center">
                  <div className="h-5 w-5 text-green-500 flex-shrink-0">✓</div>
                  <span className="ml-2 text-sm text-gray-700">{file.name}</span>
                </div>
              </div>
            )}
          </div>

          {isValidating && (
            <div className="flex justify-center items-center my-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Validating file...</span>
            </div>
          )}

          {validationResult && (
            <DataPreview validationResult={validationResult} />
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={isImporting}
            >
              Reset
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                !file ||
                isImporting ||
                isValidating ||
                (validationResult && !validationResult.valid)
              }
              className="flex items-center"
            >
              {isImporting ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <FileUp className="h-5 w-5 mr-2" />
              )}
              Import Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <ImportProgressModal
        open={showProgressModal}
        progress={importProgress}
        onOpenChange={setShowProgressModal}
      />
    </>
  );
}
