import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, XCircle, CheckCircle, FileDown, FileUp } from "lucide-react";
import ExportSection from "@/components/ExportSection";
import ImportSection from "@/components/ImportSection";
import { useToast } from "@/hooks/use-toast";
import { downloadExcelTemplate } from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("export");
  const [alertInfo, setAlertInfo] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });
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

  const showAlert = (message: string, type: "success" | "error") => {
    setAlertInfo({
      show: true,
      message,
      type,
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setAlertInfo((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const dismissAlert = () => {
    setAlertInfo((prev) => ({ ...prev, show: false }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Data Management</h1>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={handleDownloadTemplate}
            >
              <FileDown className="h-5 w-5 mr-2" />
              <span>Template</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {alertInfo.show && (
          <Alert
            className={`mb-6 ${
              alertInfo.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {alertInfo.type === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <AlertDescription className="ml-3 text-sm font-medium">
                {alertInfo.message}
              </AlertDescription>
              <button
                onClick={dismissAlert}
                className="ml-auto pl-3"
                aria-label="Close"
              >
                <XCircle className={`h-5 w-5 ${
                  alertInfo.type === "success" ? "text-green-500" : "text-red-500"
                }`} />
              </button>
            </div>
          </Alert>
        )}

        <Tabs defaultValue="export" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start">
            <TabsTrigger
              value="export"
              className="py-4 px-1 border-b-2 font-medium text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 transition-none"
            >
              Export Data
            </TabsTrigger>
            <TabsTrigger
              value="import"
              className="py-4 px-1 border-b-2 font-medium text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 transition-none"
            >
              Import Data
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="mt-0">
            <ExportSection showAlert={showAlert} />
          </TabsContent>
          
          <TabsContent value="import" className="mt-0">
            <ImportSection showAlert={showAlert} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
