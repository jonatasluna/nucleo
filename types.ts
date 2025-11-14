export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
}

export type ToolCondition = 'Good' | 'Needs Repair' | 'Broken';

export interface Tool {
  id: string;
  name: string;
  condition: ToolCondition;
}

export interface MasterMaterial {
  id: string;
  name: string;
  unit: string;
}

export interface MasterTool {
    id: string;
    name: string;
}

export type VehicleType = 'Poda' | 'Prontidão' | 'Comercial';

export interface Vehicle {
  id: string;
  name: string;
  operatorIds: string[];
  plate: string;
  materials: Material[];
  tools: Tool[];
  type: VehicleType;
  defects: string[];
  created_at?: string;
}

export interface User {
  id:string;
  username: string; // Matricula
  name: string;
  email: string;
  role: 'admin' | 'operator';
  assignedVehicleId?: string; // Only for operators
}

export interface Notification {
  id: string;
  vehicleId: string;
  vehicleName: string;
  message: string;
  timestamp: string; // Supabase returns ISO string
  type: 'update' | 'alert' | 'request';
  read: boolean;
  itemType?: 'material' | 'tool' | 'vehicle';
  userId?: string; // For access requests
  created_at?: string;
}