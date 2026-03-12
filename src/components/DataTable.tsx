import React, { useState } from 'react';
import { Search, Upload, Download, Plus, Edit, Trash2, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export interface Column {
  header: string;
  accessor: string;
  render?: (value: any, item: any) => React.ReactNode;
  options?: string[];
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  searchPlaceholder?: string;
  exportFileName?: string;
  onAdd?: (item: any) => void;
  onAddMultiple?: (items: any[]) => void;
  onEdit?: (item: any, index: number) => void;
  onDelete?: (index: number) => void;
}

export function DataTable({ columns, data, searchPlaceholder, exportFileName = "Data", onAdd, onAddMultiple, onEdit, onDelete }: DataTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenAdd = () => {
    setFormData({});
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, index: number) => {
    setFormData({ ...item });
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingIndex(null);
  };

  const handleSave = () => {
    if (editingIndex !== null && onEdit) {
      onEdit(formData, editingIndex);
    } else if (onAdd) {
      onAdd(formData);
    }
    handleCloseModal();
  };

  const handleChange = (accessor: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [accessor]: value }));
  };

  const handleExport = () => {
    if (data.length === 0) {
      console.warn("No data to export");
      return;
    }

    const exportData = data.map(row => {
      const rowData: any = {};
      columns.forEach(col => {
        rowData[col.header] = row[col.accessor];
      });
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Ensure sheet name is valid (max 31 chars, no special chars)
    const safeSheetName = exportFileName.substring(0, 31).replace(/[\\/?*[\]]/g, '');
    
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    XLSX.writeFile(workbook, `${exportFileName.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) return;

      const headerToAccessor: Record<string, string> = {};
      columns.forEach(col => {
        headerToAccessor[col.header] = col.accessor;
      });

      const newItems = jsonData.map((row: any) => {
        const item: any = {};
        Object.keys(row).forEach(header => {
          const accessor = headerToAccessor[header];
          if (accessor) {
            item[accessor] = row[header];
          }
        });
        
        columns.forEach(col => {
          if (item[col.accessor] === undefined) {
            item[col.accessor] = '';
          }
        });
        return item;
      });

      if (onAddMultiple && newItems.length > 0) {
        onAddMultiple(newItems);
      } else if (onAdd && newItems.length > 0) {
        // Fallback if onAddMultiple is not provided
        newItems.forEach(item => onAdd(item));
      }
    };
    reader.readAsBinaryString(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-none leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
            placeholder={searchPlaceholder || "Search..."}
          />
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={handleUploadClick}
            className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-bold tracking-wider uppercase text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </button>
          <button 
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-bold tracking-wider uppercase text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button 
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-bold tracking-wider uppercase text-white bg-[#f27d26] hover:bg-[#e06b15] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f27d26] transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="bg-white border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                        {col.header}
                      </th>
                    ))}
                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      {columns.map((col, colIdx) => (
                        <td key={colIdx} className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">
                          {col.render ? col.render(item[col.accessor], item) : item[col.accessor]}
                        </td>
                      ))}
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleOpenEdit(item, idx)} className="text-gray-400 hover:text-black transition-colors"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => onDelete && onDelete(idx)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-sm text-gray-500">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-serif italic text-gray-900">
                {editingIndex !== null ? 'Edit Record' : 'Add New Record'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {columns.map((col) => (
                <div key={col.accessor}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {col.header}
                  </label>
                  {col.options ? (
                    <select
                      value={formData[col.accessor] || ''}
                      onChange={(e) => handleChange(col.accessor, e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-none shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                    >
                      <option value="">Select {col.header}</option>
                      {col.options.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData[col.accessor] || ''}
                      onChange={(e) => handleChange(col.accessor, e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-none shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end gap-3 shrink-0">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
