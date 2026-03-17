import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Database } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { useMasterData } from '../context/MasterDataContext';

const tabs = [
  { name: 'MATERIALS', path: 'materials' },
  { name: 'FG PRODUCTS', path: 'products' },
  { name: 'MANUFACTURING PROCESSES', path: 'processes' },
  { name: 'STATUS TYPES', path: 'status' },
  { name: 'MACHINES', path: 'machines' },
  { name: 'MOLDS', path: 'molds' },
  { name: 'ROUTING MASTER', path: 'routing' },
  { name: 'WORKSHOPS', path: 'workshops' },
  { name: 'OPERATORS', path: 'operators' },
  { name: 'REJECTION REASONS', path: 'rejections' },
];

// --- Mock Data & Columns ---

// Materials
const materialsColumns: Column[] = [
  { header: 'Material Code', accessor: 'code' },
  { header: 'Material Name', accessor: 'name' },
  { header: 'Material Family', accessor: 'family' },
  { header: 'Density (g/cm³)', accessor: 'density' },
  { header: 'Standard Alloy Composition', accessor: 'alloy' },
  { header: 'Scrap Ratio %', accessor: 'scrapRatio' },
  { header: 'Default Process', accessor: 'process' },
  { header: 'Status', accessor: 'status' },
];

// Products
const productsColumns: Column[] = [
  { header: 'Product Type', accessor: 'type' },
  { header: 'Dimensions Format', accessor: 'dimensions' },
  { header: 'Compatible Processes', accessor: 'processes' },
];

// Processes
const processesColumns: Column[] = [
  { header: 'Process ID', accessor: 'id' },
  { header: 'Process Type', accessor: 'type' },
  { header: 'Description', accessor: 'description' },
  { header: 'Default Routing', accessor: 'routing' },
  { header: 'Compatible Products', accessor: 'products' },
];

// Status Types
const statusColumns: Column[] = [
  { header: 'Status Name', accessor: 'name' },
];

// Workshops
const workshopsColumns: Column[] = [
  { header: 'Workshop ID', accessor: 'id' },
  { header: 'Workshop Name', accessor: 'name' },
  { header: 'Stage Name', accessor: 'stageName' },
  { header: 'Workshop Supervisor', accessor: 'supervisor' },
];

// Machines
const machinesColumns: Column[] = [
  { header: 'Machine ID', accessor: 'id' },
  { header: 'Workshop', accessor: 'workshop' },
  { header: 'Machine Name', accessor: 'name' },
  { header: 'Machine Number', accessor: 'number' },
  { header: 'Machine Type', accessor: 'type' },
  { header: 'Production Rate', accessor: 'rate' },
  { header: 'Capacity Limits', accessor: 'capacity' },
  { header: 'Default Operator Name', accessor: 'operator' },
  { header: 'Setup Time', accessor: 'setup' },
  { header: 'Changeover Time', accessor: 'changeover' },
  { header: 'Maintenance Interval', accessor: 'maintenance' },
  { header: 'Status', accessor: 'status' },
];

// Operators
const operatorsColumns: Column[] = [
  { header: 'Operator ID', accessor: 'id' },
  { header: 'Operator Name', accessor: 'name' },
  { header: 'Workshop', accessor: 'workshop' },
];

// Molds
const moldsColumns: Column[] = [
  { header: 'Manufacturing Process', accessor: 'process' },
  { header: 'Product', accessor: 'product' },
  { header: 'Mold Number', accessor: 'number' },
  { header: 'Mold Description', accessor: 'description' },
  { header: 'Diameter Range', accessor: 'diameter' },
  { header: 'Length Range', accessor: 'length' },
  { header: 'Process Time', accessor: 'time' },
  { header: 'Mold Type', accessor: 'type' },
  { header: 'Usage Counter', accessor: 'usage' },
  { header: 'Maintenance Cycle', accessor: 'maintenance' },
  { header: 'Approx. Product Weight', accessor: 'weight' },
  { header: 'Mold Availability', accessor: 'status' },
];

// Routing Master
const routingColumns: Column[] = [
  { header: 'Route ID', accessor: 'routeId' },
  { header: 'Process Type', accessor: 'processType' },
  { header: 'Stage No', accessor: 'stageNo' },
  { header: 'WorkshopID', accessor: 'workshopId' },
  { header: 'Next Stage', accessor: 'nextStage' },
  { header: 'Stage Name', accessor: 'stageName' },
  { header: 'Product Category', accessor: 'productCategory' },
  { header: 'Std Time (min/unit)', accessor: 'stdTime' },
  { header: 'Operators Required', accessor: 'operatorsRequired' },
  { header: 'QC_Required', accessor: 'qcRequired' },
  { header: 'Skill Level', accessor: 'skillLevel' },
  { header: 'Notes', accessor: 'notes' },
];

// Rejection Reasons
const rejectionsColumns: Column[] = [
  { header: 'Rejection Code', accessor: 'code' },
  { header: 'Rejection Name', accessor: 'name' },
  { header: 'Defect Description', accessor: 'description' },
];

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="py-12 text-center">
      <Database className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-4 text-sm font-medium text-gray-900 uppercase tracking-widest">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">This module is under construction.</p>
    </div>
  );
}

export default function MasterData() {
  const {
    materials, products, processes, status, workshops, operators, machines, molds, routing, rejections,
    addMasterData, addMultipleMasterData, updateMasterData, deleteMasterData
  } = useMasterData();

  // Materials
  const handleAddMaterial = (item: any) => addMasterData('master_materials', item);
  const handleUploadMaterials = (items: any[]) => addMultipleMasterData('master_materials', items);
  const handleEditMaterial = (item: any) => {
    const id = item._id;
    if (id) updateMasterData('master_materials', id, item);
  };
  const handleDeleteMaterial = (item: any) => {
    const id = item._id;
    if (id) deleteMasterData('master_materials', id);
  };

  // Products
  const handleAddProduct = (item: any) => addMasterData('master_products', item);
  const handleUploadProducts = (items: any[]) => addMultipleMasterData('master_products', items);
  const handleEditProduct = (item: any) => {
    const id = item._id;
    if (id) updateMasterData('master_products', id, item);
  };
  const handleDeleteProduct = (item: any) => {
    const id = item._id;
    if (id) deleteMasterData('master_products', id);
  };

  // Processes
  const handleAddProcess = (item: any) => addMasterData('master_processes', item);
  const handleUploadProcesses = (items: any[]) => addMultipleMasterData('master_processes', items);
  const handleEditProcess = (item: any) => {
    const id = item._id;
    if (id) updateMasterData('master_processes', id, item);
  };
  const handleDeleteProcess = (item: any) => {
    const id = item._id;
    if (id) deleteMasterData('master_processes', id);
  };

  // Status
  const handleAddStatus = (item: any) => addMasterData('master_status', item);
  const handleUploadStatus = (items: any[]) => addMultipleMasterData('master_status', items);
  const handleEditStatus = (item: any) => {
    const id = item._id;
    if (id) updateMasterData('master_status', id, item);
  };
  const handleDeleteStatus = (item: any) => {
    const id = item._id;
    if (id) deleteMasterData('master_status', id);
  };

  // Workshops
  const handleAddWorkshop = (item: any) => addMasterData('master_workshops', item);
  const handleUploadWorkshops = (items: any[]) => addMultipleMasterData('master_workshops', items);
  const handleEditWorkshop = (item: any) => {
    const id = item._id;
    if (id) updateMasterData('master_workshops', id, item);
  };
  const handleDeleteWorkshop = (item: any) => {
    const id = item._id;
    if (id) deleteMasterData('master_workshops', id);
  };

  // Operators
  const handleAddOperator = (item: any) => addMasterData('master_operators', item);
  const handleUploadOperators = (items: any[]) => addMultipleMasterData('master_operators', items);
  const handleEditOperator = (item: any) => {
    const id = item._id;
    if (id) updateMasterData('master_operators', id, item);
  };
  const handleDeleteOperator = (item: any) => {
    const id = item._id;
    if (id) deleteMasterData('master_operators', id);
  };

  // Machines
  const handleAddMachine = (item: any) => addMasterData('master_machines', item);
  const handleUploadMachines = (items: any[]) => addMultipleMasterData('master_machines', items);
  const handleEditMachine = (item: any) => {
    const id = item._id;
    if (id) updateMasterData('master_machines', id, item);
  };
  const handleDeleteMachine = (item: any) => {
    const id = item._id;
    if (id) deleteMasterData('master_machines', id);
  };

  // Molds
  const handleAddMold = (item: any) => addMasterData('master_molds', item);
  const handleUploadMolds = (items: any[]) => addMultipleMasterData('master_molds', items);
  const handleEditMold = (item: any) => {
    const id = item._id;
    if (id) updateMasterData('master_molds', id, item);
  };
  const handleDeleteMold = (item: any) => {
    const id = item._id;
    if (id) deleteMasterData('master_molds', id);
  };

  // Routing
  const handleAddRouting = (item: any) => addMasterData('master_routing', item);
  const handleUploadRouting = (items: any[]) => addMultipleMasterData('master_routing', items);
  const handleEditRouting = (item: any) => {
    const id = item._id;
    if (id) updateMasterData('master_routing', id, item);
  };
  const handleDeleteRouting = (item: any) => {
    const id = item._id;
    if (id) deleteMasterData('master_routing', id);
  };

  // Rejections
  const handleAddRejection = (item: any) => addMasterData('master_rejections', item);
  const handleUploadRejections = (items: any[]) => addMultipleMasterData('master_rejections', items);
  const handleEditRejection = (item: any) => {
    const id = item._id;
    if (id) updateMasterData('master_rejections', id, item);
  };
  const handleDeleteRejection = (item: any) => {
    const id = item._id;
    if (id) deleteMasterData('master_rejections', id);
  };

  const dynamicRoutingColumns = routingColumns.map(col => {
    if (col.accessor === 'processType') {
      return { ...col, options: processes.map(p => p.type) };
    }
    if (col.accessor === 'workshopId') {
      return { ...col, options: workshops.map(w => w.name).sort() };
    }
    if (col.accessor === 'productCategory') {
      return { ...col, options: ['Bars', 'Bushings', 'Plates', 'Custom'] };
    }
    if (col.accessor === 'qcRequired') {
      return { ...col, options: ['Yes', 'No'] };
    }
    if (col.accessor === 'skillLevel') {
      return { ...col, options: ['Entry', 'Intermediate', 'Expert'] };
    }
    return col;
  });

  const dynamicWorkshopsColumns = workshopsColumns.map(col => {
    if (col.accessor === 'stageName') {
      return {
        ...col,
        header: 'Associated Stages',
        render: (val: any, workshop: any) => {
          const stagesFromRouting = routing
            .filter(r => r.workshopId?.trim() === workshop.name?.trim())
            .map(r => r.stageName)
            .filter(Boolean);
          
          const allStages = new Set(stagesFromRouting);
          if (val) allStages.add(val);
          
          const associatedStages = Array.from(allStages);
          
          return associatedStages.length > 0 
            ? associatedStages.join(', ') 
            : <span className="text-gray-400 italic">No stages assigned</span>;
        }
      };
    }
    return col;
  });

  const dynamicMachinesColumns = machinesColumns.map(col => {
    if (col.accessor === 'workshop') {
      return { ...col, options: workshops.map(w => w.name) };
    }
    if (col.accessor === 'operator') {
      return { ...col, options: operators.map(o => o.name) };
    }
    return col;
  });

  const dynamicOperatorsColumns = operatorsColumns.map(col => {
    if (col.accessor === 'workshop') {
      return { ...col, options: workshops.map(w => w.name) };
    }
    return col;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start">
        <nav className="flex flex-wrap gap-x-2 gap-y-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={`/master-data/${tab.path}`}
              className={({ isActive }) =>
                cn(
                  isActive
                    ? 'bg-[#141414] text-white'
                    : 'text-gray-500 hover:text-gray-900',
                  'px-4 py-2.5 text-[12px] font-bold tracking-widest uppercase transition-colors'
                )
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="pt-2">
        <Routes>
          <Route path="/" element={<Navigate to="materials" replace />} />
          <Route path="materials" element={<DataTable columns={materialsColumns} data={materials} onAdd={handleAddMaterial} onAddMultiple={handleUploadMaterials} onEdit={handleEditMaterial} onDelete={handleDeleteMaterial} searchPlaceholder="Search Materials..." exportFileName="Materials" />} />
          <Route path="products" element={<DataTable columns={productsColumns} data={products} onAdd={handleAddProduct} onAddMultiple={handleUploadProducts} onEdit={handleEditProduct} onDelete={handleDeleteProduct} searchPlaceholder="Search Products..." exportFileName="Products" />} />
          <Route path="processes" element={<DataTable columns={processesColumns} data={processes} onAdd={handleAddProcess} onAddMultiple={handleUploadProcesses} onEdit={handleEditProcess} onDelete={handleDeleteProcess} searchPlaceholder="Search Processes..." exportFileName="Processes" />} />
          <Route path="status" element={<DataTable columns={statusColumns} data={status} onAdd={handleAddStatus} onAddMultiple={handleUploadStatus} onEdit={handleEditStatus} onDelete={handleDeleteStatus} searchPlaceholder="Search Status Types..." exportFileName="Status Types" />} />
          <Route path="workshops" element={<DataTable columns={dynamicWorkshopsColumns} data={workshops} onAdd={handleAddWorkshop} onAddMultiple={handleUploadWorkshops} onEdit={handleEditWorkshop} onDelete={handleDeleteWorkshop} searchPlaceholder="Search Workshops..." exportFileName="Workshops" />} />
          <Route path="operators" element={<DataTable columns={dynamicOperatorsColumns} data={operators} onAdd={handleAddOperator} onAddMultiple={handleUploadOperators} onEdit={handleEditOperator} onDelete={handleDeleteOperator} searchPlaceholder="Search Operators..." exportFileName="Operators" />} />
          <Route path="machines" element={<DataTable columns={dynamicMachinesColumns} data={machines} onAdd={handleAddMachine} onAddMultiple={handleUploadMachines} onEdit={handleEditMachine} onDelete={handleDeleteMachine} searchPlaceholder="Search Machines..." exportFileName="Machines" />} />
          <Route path="molds" element={<DataTable columns={moldsColumns} data={molds} onAdd={handleAddMold} onAddMultiple={handleUploadMolds} onEdit={handleEditMold} onDelete={handleDeleteMold} searchPlaceholder="Search Molds..." exportFileName="Molds" />} />
          <Route path="routing" element={<DataTable columns={dynamicRoutingColumns} data={routing} onAdd={handleAddRouting} onAddMultiple={handleUploadRouting} onEdit={handleEditRouting} onDelete={handleDeleteRouting} searchPlaceholder="Search Routing..." exportFileName="Routing Master" />} />
          <Route path="rejections" element={<DataTable columns={rejectionsColumns} data={rejections} onAdd={handleAddRejection} onAddMultiple={handleUploadRejections} onEdit={handleEditRejection} onDelete={handleDeleteRejection} searchPlaceholder="Search Rejection Reasons..." exportFileName="Rejection Reasons" />} />
        </Routes>
      </div>
    </div>
  );
}
