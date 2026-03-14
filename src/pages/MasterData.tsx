import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Database } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { useMasterData } from '../context/MasterDataContext';

const tabs = [
  { name: 'MATERIALS', path: 'materials' },
  { name: 'FG PRODUCTS', path: 'products' },
  { name: 'CASTING TYPES', path: 'casting-types' },
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
  { header: 'Casting Type', accessor: 'castingType' },
  { header: 'Stage No', accessor: 'stageNo' },
  { header: 'Workshop ID', accessor: 'workshopId' },
  { header: 'Next Stage', accessor: 'nextStage' },
  { header: 'Stage Name', accessor: 'stageName' },
  { header: 'Product Category', accessor: 'productCategory' },
  { header: 'Std Time (min/unit)', accessor: 'stdTime' },
  { header: 'Operators Required', accessor: 'operatorsRequired' },
  { header: 'QC Required', accessor: 'qcRequired' },
  { header: 'Skill Level', accessor: 'skillLevel' },
  { header: 'Notes', accessor: 'notes' },
];

// Casting Types
const castingTypesColumns: Column[] = [
  { header: 'Casting Type', accessor: 'name' },
  { header: 'Description', accessor: 'description' },
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
    materials, products, processes, status, workshops, operators, machines, molds, routing, rejections, castingTypes,
    addMasterData, updateMasterData, deleteMasterData
  } = useMasterData();

  // Materials
  const handleAddMaterial = (item: any) => addMasterData('master_materials', item);
  const handleEditMaterial = (item: any, index: number) => {
    const id = materials[index]?._id;
    if (id) updateMasterData('master_materials', id, item);
  };
  const handleDeleteMaterial = (index: number) => {
    const id = materials[index]?._id;
    if (id) deleteMasterData('master_materials', id);
  };

  // Products
  const handleAddProduct = (item: any) => addMasterData('master_products', item);
  const handleEditProduct = (item: any, index: number) => {
    const id = products[index]?._id;
    if (id) updateMasterData('master_products', id, item);
  };
  const handleDeleteProduct = (index: number) => {
    const id = products[index]?._id;
    if (id) deleteMasterData('master_products', id);
  };

  // Processes
  const handleAddProcess = (item: any) => addMasterData('master_processes', item);
  const handleEditProcess = (item: any, index: number) => {
    const id = processes[index]?._id;
    if (id) updateMasterData('master_processes', id, item);
  };
  const handleDeleteProcess = (index: number) => {
    const id = processes[index]?._id;
    if (id) deleteMasterData('master_processes', id);
  };

  // Status
  const handleAddStatus = (item: any) => addMasterData('master_status', item);
  const handleEditStatus = (item: any, index: number) => {
    const id = status[index]?._id;
    if (id) updateMasterData('master_status', id, item);
  };
  const handleDeleteStatus = (index: number) => {
    const id = status[index]?._id;
    if (id) deleteMasterData('master_status', id);
  };

  // Workshops
  const handleAddWorkshop = (item: any) => addMasterData('master_workshops', item);
  const handleEditWorkshop = (item: any, index: number) => {
    const id = workshops[index]?._id;
    if (id) updateMasterData('master_workshops', id, item);
  };
  const handleDeleteWorkshop = (index: number) => {
    const id = workshops[index]?._id;
    if (id) deleteMasterData('master_workshops', id);
  };

  // Operators
  const handleAddOperator = (item: any) => addMasterData('master_operators', item);
  const handleEditOperator = (item: any, index: number) => {
    const id = operators[index]?._id;
    if (id) updateMasterData('master_operators', id, item);
  };
  const handleDeleteOperator = (index: number) => {
    const id = operators[index]?._id;
    if (id) deleteMasterData('master_operators', id);
  };

  // Machines
  const handleAddMachine = (item: any) => addMasterData('master_machines', item);
  const handleEditMachine = (item: any, index: number) => {
    const id = machines[index]?._id;
    if (id) updateMasterData('master_machines', id, item);
  };
  const handleDeleteMachine = (index: number) => {
    const id = machines[index]?._id;
    if (id) deleteMasterData('master_machines', id);
  };

  // Molds
  const handleAddMold = (item: any) => addMasterData('master_molds', item);
  const handleEditMold = (item: any, index: number) => {
    const id = molds[index]?._id;
    if (id) updateMasterData('master_molds', id, item);
  };
  const handleDeleteMold = (index: number) => {
    const id = molds[index]?._id;
    if (id) deleteMasterData('master_molds', id);
  };

  // Routing
  const handleAddRouting = (item: any) => addMasterData('master_routing', item);
  const handleEditRouting = (item: any, index: number) => {
    const id = routing[index]?._id;
    if (id) updateMasterData('master_routing', id, item);
  };
  const handleDeleteRouting = (index: number) => {
    const id = routing[index]?._id;
    if (id) deleteMasterData('master_routing', id);
  };

  // Rejections
  const handleAddRejection = (item: any) => addMasterData('master_rejections', item);
  const handleEditRejection = (item: any, index: number) => {
    const id = rejections[index]?._id;
    if (id) updateMasterData('master_rejections', id, item);
  };
  const handleDeleteRejection = (index: number) => {
    const id = rejections[index]?._id;
    if (id) deleteMasterData('master_rejections', id);
  };

  // Casting Types
  const handleAddCastingType = (item: any) => addMasterData('master_casting_types', item);
  const handleEditCastingType = (item: any, index: number) => {
    const id = castingTypes[index]?._id;
    if (id) updateMasterData('master_casting_types', id, item);
  };
  const handleDeleteCastingType = (index: number) => {
    const id = castingTypes[index]?._id;
    if (id) deleteMasterData('master_casting_types', id);
  };

  const dynamicRoutingColumns = routingColumns.map(col => {
    if (col.accessor === 'castingType') {
      return { ...col, options: castingTypes.map(ct => ct.name) };
    }
    if (col.accessor === 'workshopId') {
      return { ...col, options: workshops.map(w => w.name) };
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
          <Route path="materials" element={<DataTable columns={materialsColumns} data={materials} onAdd={handleAddMaterial} onEdit={handleEditMaterial} onDelete={handleDeleteMaterial} searchPlaceholder="Search Materials..." exportFileName="Materials" />} />
          <Route path="products" element={<DataTable columns={productsColumns} data={products} onAdd={handleAddProduct} onEdit={handleEditProduct} onDelete={handleDeleteProduct} searchPlaceholder="Search Products..." exportFileName="Products" />} />
          <Route path="casting-types" element={<DataTable columns={castingTypesColumns} data={castingTypes} onAdd={handleAddCastingType} onEdit={handleEditCastingType} onDelete={handleDeleteCastingType} searchPlaceholder="Search Casting Types..." exportFileName="Casting Types" />} />
          <Route path="processes" element={<DataTable columns={processesColumns} data={processes} onAdd={handleAddProcess} onEdit={handleEditProcess} onDelete={handleDeleteProcess} searchPlaceholder="Search Processes..." exportFileName="Processes" />} />
          <Route path="status" element={<DataTable columns={statusColumns} data={status} onAdd={handleAddStatus} onEdit={handleEditStatus} onDelete={handleDeleteStatus} searchPlaceholder="Search Status Types..." exportFileName="Status Types" />} />
          <Route path="workshops" element={<DataTable columns={workshopsColumns} data={workshops} onAdd={handleAddWorkshop} onEdit={handleEditWorkshop} onDelete={handleDeleteWorkshop} searchPlaceholder="Search Workshops..." exportFileName="Workshops" />} />
          <Route path="operators" element={<DataTable columns={dynamicOperatorsColumns} data={operators} onAdd={handleAddOperator} onEdit={handleEditOperator} onDelete={handleDeleteOperator} searchPlaceholder="Search Operators..." exportFileName="Operators" />} />
          <Route path="machines" element={<DataTable columns={dynamicMachinesColumns} data={machines} onAdd={handleAddMachine} onEdit={handleEditMachine} onDelete={handleDeleteMachine} searchPlaceholder="Search Machines..." exportFileName="Machines" />} />
          <Route path="molds" element={<DataTable columns={moldsColumns} data={molds} onAdd={handleAddMold} onEdit={handleEditMold} onDelete={handleDeleteMold} searchPlaceholder="Search Molds..." exportFileName="Molds" />} />
          <Route path="routing" element={<DataTable columns={dynamicRoutingColumns} data={routing} onAdd={handleAddRouting} onEdit={handleEditRouting} onDelete={handleDeleteRouting} searchPlaceholder="Search Routing..." exportFileName="Routing Master" />} />
          <Route path="rejections" element={<DataTable columns={rejectionsColumns} data={rejections} onAdd={handleAddRejection} onEdit={handleEditRejection} onDelete={handleDeleteRejection} searchPlaceholder="Search Rejection Reasons..." exportFileName="Rejection Reasons" />} />
        </Routes>
      </div>
    </div>
  );
}
