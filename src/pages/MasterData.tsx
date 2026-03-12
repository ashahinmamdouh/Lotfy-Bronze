import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Database } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';

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
const initialMaterials = [
  { code: 'BRZ-01', name: 'Bronze C93200', family: 'Bronze', density: '8.93', alloy: 'Cu 83%, Sn 7%, Pb 7%, Zn 3%', scrapRatio: '5%', process: 'Sand Casting', status: 'Active' },
  { code: 'BRZ-02', name: 'Aluminum Bronze C95400', family: 'Bronze', density: '7.45', alloy: 'Cu 85%, Al 11%, Fe 4%', scrapRatio: '4%', process: 'Centrifugal Casting', status: 'Active' },
];

// Products
const productsColumns: Column[] = [
  { header: 'Product Type', accessor: 'type' },
  { header: 'Dimensions Format', accessor: 'dimensions' },
  { header: 'Compatible Processes', accessor: 'processes' },
];
const initialProducts = [
  { type: 'Bars', dimensions: 'OD, ID, Length', processes: 'Continuous Casting, Stock' },
  { type: 'Bushings', dimensions: 'OD, ID, Length', processes: 'Centrifugal Casting, Stock' },
  { type: 'Plates', dimensions: 'Width, Length, Height', processes: 'Sand Casting, Stock' },
  { type: 'Impellers', dimensions: 'Diameter, Impeller Number, Drawing reference', processes: 'Sand Casting, Stock' },
  { type: 'Custom', dimensions: 'Custom', processes: 'Any' },
];

// Processes
const processesColumns: Column[] = [
  { header: 'Process ID', accessor: 'id' },
  { header: 'Process Type', accessor: 'type' },
  { header: 'Description', accessor: 'description' },
  { header: 'Default Routing', accessor: 'routing' },
  { header: 'Compatible Products', accessor: 'products' },
];
const initialProcesses = [
  { id: 'PRC-01', type: 'Sand Casting', description: 'Traditional sand mold casting', routing: 'RT-01', products: 'Impellers, Plates' },
  { id: 'PRC-02', type: 'Continuous Casting', description: 'Continuous casting for long products', routing: 'RT-02', products: 'Bars' },
  { id: 'PRC-03', type: 'Centrifugal Casting (Vertical)', description: 'Vertical centrifugal casting', routing: 'RT-03', products: 'Bushings' },
  { id: 'PRC-04', type: 'Stock Material', description: 'Raw material from stock', routing: 'RT-04', products: 'Bars, Plates' },
];

// Status Types
const statusColumns: Column[] = [
  { header: 'Status Name', accessor: 'name' },
];
const initialStatus = [
  { name: 'Not Started – Waiting Material' },
  { name: 'Not Started – Waiting Technical Office' },
  { name: 'Not Started - Planned' },
  { name: 'In Production' },
  { name: 'Under Inspection' },
  { name: 'Rework' },
  { name: 'Completed' },
  { name: 'Cancelled' },
  { name: 'On Hold' },
];

// Workshops
const workshopsColumns: Column[] = [
  { header: 'Workshop ID', accessor: 'id' },
  { header: 'Workshop Name', accessor: 'name' },
  { header: 'Workshop Supervisor', accessor: 'supervisor' },
];
const initialWorkshops = [
  { id: 'WS-01', name: 'Foundry', supervisor: 'Ahmed Hassan' },
  { id: 'WS-02', name: 'Machining', supervisor: 'Mohamed Ali' },
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
const initialMachines = [
  { id: 'MAC-01', workshop: 'Foundry', name: 'Induction Furnace A', number: 'F-01', type: 'Furnace', rate: '500 kg/hr', capacity: '1000 kg', operator: 'Ahmed', setup: '30 min', changeover: '60 min', maintenance: 'Weekly', status: 'Running' },
];

// Operators
const operatorsColumns: Column[] = [
  { header: 'Operator ID', accessor: 'id' },
  { header: 'Operator Name', accessor: 'name' },
  { header: 'Workshop', accessor: 'workshop' },
];
const initialOperators = [
  { id: 'OP-01', name: 'Ahmed', workshop: 'Foundry' },
  { id: 'OP-02', name: 'Mohamed', workshop: 'Machining' },
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
const initialMolds = [
  { process: 'Centrifugal Casting', product: 'Bushings', number: 'MLD-101', description: 'Standard Bushing Mold', diameter: '50-100mm', length: '200mm', time: '15 min', type: 'Steel', usage: '150', maintenance: '500 uses', weight: '10 kg', status: 'Running' },
];

// Routing Master
const routingColumns: Column[] = [
  { header: 'Routing ID', accessor: 'id' },
  { header: 'Process Type', accessor: 'process' },
  { header: 'Operation Sequence', accessor: 'sequence' },
  { header: 'Operation Name', accessor: 'name' },
  { header: 'Machine Type', accessor: 'machine' },
  { header: 'Standard Time', accessor: 'time' },
  { header: 'Quality Check Required', accessor: 'quality' },
];
const initialRouting = [
  { id: 'RT-01', process: 'Sand Casting', sequence: '10', name: 'Pattern Preparation', machine: 'Manual', time: '30 min', quality: 'No' },
  { id: 'RT-01', process: 'Sand Casting', sequence: '20', name: 'Molding', machine: 'Molding Machine', time: '45 min', quality: 'Yes' },
];

// Rejection Reasons
const rejectionsColumns: Column[] = [
  { header: 'Rejection Code', accessor: 'code' },
  { header: 'Rejection Name', accessor: 'name' },
  { header: 'Defect Description', accessor: 'description' },
];
const initialRejections = [
  { code: 'REJ-01', name: 'Porosity', description: 'Gas holes or shrinkage cavities in the casting' },
  { code: 'REJ-02', name: 'Inclusions', description: 'Non-metallic particles trapped in the metal' },
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
  const [materials, setMaterials] = useState(initialMaterials);
  const [products, setProducts] = useState(initialProducts);
  const [processes, setProcesses] = useState(initialProcesses);
  const [status, setStatus] = useState(initialStatus);
  const [workshops, setWorkshops] = useState(initialWorkshops);
  const [operators, setOperators] = useState(initialOperators);
  const [machines, setMachines] = useState(initialMachines);
  const [molds, setMolds] = useState(initialMolds);
  const [routing, setRouting] = useState(initialRouting);
  const [rejections, setRejections] = useState(initialRejections);

  // Materials
  const handleAddMaterial = (item: any) => setMaterials([...materials, item]);
  const handleAddMultipleMaterials = (items: any[]) => setMaterials([...materials, ...items]);
  const handleEditMaterial = (item: any, index: number) => {
    const newData = [...materials];
    newData[index] = item;
    setMaterials(newData);
  };
  const handleDeleteMaterial = (index: number) => setMaterials(materials.filter((_, i) => i !== index));

  // Products
  const handleAddProduct = (item: any) => setProducts([...products, item]);
  const handleAddMultipleProducts = (items: any[]) => setProducts([...products, ...items]);
  const handleEditProduct = (item: any, index: number) => {
    const newData = [...products];
    newData[index] = item;
    setProducts(newData);
  };
  const handleDeleteProduct = (index: number) => setProducts(products.filter((_, i) => i !== index));

  // Processes
  const handleAddProcess = (item: any) => setProcesses([...processes, item]);
  const handleAddMultipleProcesses = (items: any[]) => setProcesses([...processes, ...items]);
  const handleEditProcess = (item: any, index: number) => {
    const newData = [...processes];
    newData[index] = item;
    setProcesses(newData);
  };
  const handleDeleteProcess = (index: number) => setProcesses(processes.filter((_, i) => i !== index));

  // Status
  const handleAddStatus = (item: any) => setStatus([...status, item]);
  const handleAddMultipleStatus = (items: any[]) => setStatus([...status, ...items]);
  const handleEditStatus = (item: any, index: number) => {
    const newData = [...status];
    newData[index] = item;
    setStatus(newData);
  };
  const handleDeleteStatus = (index: number) => setStatus(status.filter((_, i) => i !== index));

  // Workshops
  const handleAddWorkshop = (item: any) => setWorkshops([...workshops, item]);
  const handleAddMultipleWorkshops = (items: any[]) => setWorkshops([...workshops, ...items]);
  const handleEditWorkshop = (item: any, index: number) => {
    const newData = [...workshops];
    newData[index] = item;
    setWorkshops(newData);
  };
  const handleDeleteWorkshop = (index: number) => setWorkshops(workshops.filter((_, i) => i !== index));

  // Operators
  const handleAddOperator = (item: any) => setOperators([...operators, item]);
  const handleAddMultipleOperators = (items: any[]) => setOperators([...operators, ...items]);
  const handleEditOperator = (item: any, index: number) => {
    const newData = [...operators];
    newData[index] = item;
    setOperators(newData);
  };
  const handleDeleteOperator = (index: number) => setOperators(operators.filter((_, i) => i !== index));

  // Machines
  const handleAddMachine = (item: any) => setMachines([...machines, item]);
  const handleAddMultipleMachines = (items: any[]) => setMachines([...machines, ...items]);
  const handleEditMachine = (item: any, index: number) => {
    const newData = [...machines];
    newData[index] = item;
    setMachines(newData);
  };
  const handleDeleteMachine = (index: number) => setMachines(machines.filter((_, i) => i !== index));

  // Molds
  const handleAddMold = (item: any) => setMolds([...molds, item]);
  const handleAddMultipleMolds = (items: any[]) => setMolds([...molds, ...items]);
  const handleEditMold = (item: any, index: number) => {
    const newData = [...molds];
    newData[index] = item;
    setMolds(newData);
  };
  const handleDeleteMold = (index: number) => setMolds(molds.filter((_, i) => i !== index));

  // Routing
  const handleAddRouting = (item: any) => setRouting([...routing, item]);
  const handleAddMultipleRouting = (items: any[]) => setRouting([...routing, ...items]);
  const handleEditRouting = (item: any, index: number) => {
    const newData = [...routing];
    newData[index] = item;
    setRouting(newData);
  };
  const handleDeleteRouting = (index: number) => setRouting(routing.filter((_, i) => i !== index));

  // Rejections
  const handleAddRejection = (item: any) => setRejections([...rejections, item]);
  const handleAddMultipleRejections = (items: any[]) => setRejections([...rejections, ...items]);
  const handleEditRejection = (item: any, index: number) => {
    const newData = [...rejections];
    newData[index] = item;
    setRejections(newData);
  };
  const handleDeleteRejection = (index: number) => setRejections(rejections.filter((_, i) => i !== index));

  const dynamicRoutingColumns = routingColumns.map(col => {
    if (col.accessor === 'process') {
      return { ...col, options: processes.map(p => p.type) };
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
      <div>
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
          <Route path="materials" element={<DataTable columns={materialsColumns} data={materials} onAdd={handleAddMaterial} onAddMultiple={handleAddMultipleMaterials} onEdit={handleEditMaterial} onDelete={handleDeleteMaterial} searchPlaceholder="Search Materials..." exportFileName="Materials" />} />
          <Route path="products" element={<DataTable columns={productsColumns} data={products} onAdd={handleAddProduct} onAddMultiple={handleAddMultipleProducts} onEdit={handleEditProduct} onDelete={handleDeleteProduct} searchPlaceholder="Search Products..." exportFileName="Products" />} />
          <Route path="processes" element={<DataTable columns={processesColumns} data={processes} onAdd={handleAddProcess} onAddMultiple={handleAddMultipleProcesses} onEdit={handleEditProcess} onDelete={handleDeleteProcess} searchPlaceholder="Search Processes..." exportFileName="Processes" />} />
          <Route path="status" element={<DataTable columns={statusColumns} data={status} onAdd={handleAddStatus} onAddMultiple={handleAddMultipleStatus} onEdit={handleEditStatus} onDelete={handleDeleteStatus} searchPlaceholder="Search Status Types..." exportFileName="Status Types" />} />
          <Route path="workshops" element={<DataTable columns={workshopsColumns} data={workshops} onAdd={handleAddWorkshop} onAddMultiple={handleAddMultipleWorkshops} onEdit={handleEditWorkshop} onDelete={handleDeleteWorkshop} searchPlaceholder="Search Workshops..." exportFileName="Workshops" />} />
          <Route path="operators" element={<DataTable columns={dynamicOperatorsColumns} data={operators} onAdd={handleAddOperator} onAddMultiple={handleAddMultipleOperators} onEdit={handleEditOperator} onDelete={handleDeleteOperator} searchPlaceholder="Search Operators..." exportFileName="Operators" />} />
          <Route path="machines" element={<DataTable columns={dynamicMachinesColumns} data={machines} onAdd={handleAddMachine} onAddMultiple={handleAddMultipleMachines} onEdit={handleEditMachine} onDelete={handleDeleteMachine} searchPlaceholder="Search Machines..." exportFileName="Machines" />} />
          <Route path="molds" element={<DataTable columns={moldsColumns} data={molds} onAdd={handleAddMold} onAddMultiple={handleAddMultipleMolds} onEdit={handleEditMold} onDelete={handleDeleteMold} searchPlaceholder="Search Molds..." exportFileName="Molds" />} />
          <Route path="routing" element={<DataTable columns={dynamicRoutingColumns} data={routing} onAdd={handleAddRouting} onAddMultiple={handleAddMultipleRouting} onEdit={handleEditRouting} onDelete={handleDeleteRouting} searchPlaceholder="Search Routing..." exportFileName="Routing Master" />} />
          <Route path="rejections" element={<DataTable columns={rejectionsColumns} data={rejections} onAdd={handleAddRejection} onAddMultiple={handleAddMultipleRejections} onEdit={handleEditRejection} onDelete={handleDeleteRejection} searchPlaceholder="Search Rejection Reasons..." exportFileName="Rejection Reasons" />} />
        </Routes>
      </div>
    </div>
  );
}
