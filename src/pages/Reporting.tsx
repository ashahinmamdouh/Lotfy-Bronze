import React from 'react';
import { BarChart3, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

const reports = [
  { id: 1, name: 'Work Order Status Report', description: 'Current status of all active and completed work orders.' },
  { id: 2, name: 'Production Efficiency Report', description: 'Analysis of planned vs actual production times and yields.' },
  { id: 3, name: 'Machine Utilization Report', description: 'Uptime, downtime, and capacity utilization by machine.' },
  { id: 4, name: 'Material Consumption Report', description: 'Raw material usage, scrap generation, and yield percentages.' },
  { id: 5, name: 'Scrap Analysis Report', description: 'Breakdown of scrap by material, process, and rejection reason.' },
  { id: 6, name: 'Delivery Performance Report', description: 'On-time delivery metrics and average lead times.' },
];

export default function Reporting() {
  const handleExportExcel = (reportName: string) => {
    // Generate some mock data for the report
    const mockData = [
      { id: 1, metric: 'Value A', score: 85 },
      { id: 2, metric: 'Value B', score: 92 },
      { id: 3, metric: 'Value C', score: 78 },
    ];

    const worksheet = XLSX.utils.json_to_sheet(mockData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
    XLSX.writeFile(workbook, `${reportName.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reporting</h1>
        <p className="mt-1 text-sm text-gray-500">Generate and export operational reports.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div key={report.id} className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{report.name}</h3>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{report.description}</p>
              </div>
            </div>
            <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">Export as:</div>
              <div className="flex gap-2">
                <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <FileText className="h-4 w-4 mr-1 text-red-500" /> PDF
                </button>
                <button 
                  onClick={() => handleExportExcel(report.name)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Download className="h-4 w-4 mr-1 text-green-600" /> Excel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
