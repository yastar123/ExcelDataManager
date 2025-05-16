import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileDown } from "lucide-react";
import { exportToExcel } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ExportSectionProps {
  showAlert: (message: string, type: "success" | "error") => void;
}

export default function ExportSection({ showAlert }: ExportSectionProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "standardid",
    "tanggal",
    "actual",
    "kategori",
    "status",
  ]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const toggleColumn = (column: string) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter((col) => col !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const handleExport = async () => {
    try {
      if (selectedColumns.length === 0) {
        toast({
          title: "Export Error",
          description: "Please select at least one column to export.",
          variant: "destructive",
        });
        return;
      }

      setIsExporting(true);
      showAlert("Generating Excel file...", "success");

      await exportToExcel({
        columns: selectedColumns,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      showAlert("Export completed successfully! Your file is downloading.", "success");
    } catch (error) {
      console.error("Export error:", error);
      showAlert("Export failed. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    { id: "standardid", label: "standardid" },
    { id: "tanggal", label: "tanggal" },
    { id: "actual", label: "actual" },
    { id: "kategori", label: "kategori" },
    { id: "status", label: "status" },
    { id: "keterangan", label: "keterangan" },
    { id: "created_at", label: "created_at" },
    { id: "updated_at", label: "updated_at" },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Export Data</h2>
        <p className="text-sm text-gray-500 mb-6">
          Select columns to export and download data as Excel file (.xlsx).
        </p>

        <div className="mb-6">
          <Label className="text-sm font-medium text-gray-700 block mb-2">
            Select columns to export
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {columns.map((column) => (
              <div className="flex items-center" key={column.id}>
                <Checkbox
                  id={`column-${column.id}`}
                  checked={selectedColumns.includes(column.id)}
                  onCheckedChange={() => toggleColumn(column.id)}
                />
                <Label
                  htmlFor={`column-${column.id}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <Label className="text-sm font-medium text-gray-700 block mb-2">
            Filter data (optional)
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </Label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
            className="flex items-center"
          >
            <FileDown className="h-5 w-5 mr-2" />
            Export to Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
