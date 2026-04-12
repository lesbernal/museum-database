// Convert data to CSV format
export function exportToCSV(data, filename = "report.csv") {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV rows
  const csvRows = [
    headers.join(","), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header] || "";
        // Wrap in quotes if contains comma or special characters
        if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    )
  ];
  
  // Create and download file
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Convert data to JSON format
export function exportToJSON(data, filename = "report.json") {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Print report
export function printReport(elementId, title = "Report") {
  const printContent = document.getElementById(elementId);
  if (!printContent) return;
  
  const originalTitle = document.title;
  document.title = title;
  
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #c5a028; padding-bottom: 10px; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #c5a028; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .summary { margin: 20px 0; padding: 10px; background: #f5f5f5; }
          @media print {
            body { margin: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div>${printContent.innerHTML}</div>
        <script>
          window.onload = function() { window.print(); window.close(); };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
  
  document.title = originalTitle;
}

// Export with summary
export function exportWithSummary(data, summary, filename = "report") {
  const exportData = {
    generated_at: new Date().toISOString(),
    summary: summary,
    data: data
  };
  
  exportToJSON(exportData, `${filename}.json`);
}