import { apiRequest } from "./queryClient";
import { ExportFilter } from "@shared/schema";

export async function getAllRecords() {
  const res = await apiRequest("GET", "/api/records", undefined);
  return res.json();
}

export async function exportToExcel(filter: ExportFilter) {
  const res = await apiRequest("POST", "/api/excel/export", filter);
  
  // Convert the response to a blob and download it
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "exported_data.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  
  return true;
}

export async function downloadExcelTemplate() {
  const res = await apiRequest("GET", "/api/excel/template", undefined);
  
  // Convert the response to a blob and download it
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "import_template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  
  return true;
}

export async function validateExcelFile(formData: FormData) {
  const res = await fetch("/api/excel/validate", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  
  return res.json();
}

export async function importExcelData(formData: FormData) {
  const res = await fetch("/api/excel/import", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  
  return res.json();
}
