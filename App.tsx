
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Vehicle, User, Notification, VehicleType, MasterMaterial, MasterTool } from './types';
import AdminDashboard from './pages/AdminDashboard';
import VehicleDetail from './pages/VehicleDetail';
import Login from './pages/Login';
import Home from './pages/Home';

// Mock data for initial state (used only if no saved data exists)
const initialUsers: User[] = [
    { id: 'u1', username: 'admin', name: 'Admin User', password: 'admin', role: 'admin' },
    { id: 'u2', username: 'user1', name: 'João Silva', password: 'user1', role: 'operator', assignedVehicleId: 'v1' },
    { id: 'u3', username: 'user2', name: 'Maria Oliveira', password: 'user2', role: 'operator', assignedVehicleId: 'v2' },
    { id: 'u4', username: 'user3', name: 'Carlos Pereira', password: 'user3', role: 'operator', assignedVehicleId: 'v3' },
];

const initialVehicles: Vehicle[] = [
  {
    id: 'v1',
    name: 'Viatura 01 - Alpha',
    operatorIds: ['u2'],
    plate: 'ABC-1234',
    type: 'Prontidão',
    materials: [
      { id: 'mm1', name: 'Cabos de Fibra Óptica', quantity: 500, unit: 'metros', threshold: 100 },
      { id: 'mm2', name: 'Conectores SC/APC', quantity: 85, unit: 'unidades', threshold: 20 },
      { id: 'mm3', name: 'Fita Isolante', quantity: 8, unit: 'rolos', threshold: 5 },
    ],
    tools: [
      { id: 'mt1', name: 'Máquina de Fusão', condition: 'Good' },
      { id: 'mt2', name: 'Clivador de Precisão', condition: 'Good' },
      { id: 'mt3', name: 'Alicate de Corte', condition: 'Needs Repair' },
    ],
    defects: [],
  },
  {
    id: 'v2',
    name: 'Viatura 02 - Bravo',
    operatorIds: ['u3'],
    plate: 'XYZ-5678',
    type: 'Comercial',
    materials: [
      { id: 'mm1', name: 'Cabos de Fibra Óptica', quantity: 80, unit: 'metros', threshold: 100 },
      { id: 'mm2', name: 'Conectores SC/APC', quantity: 150, unit: 'unidades', threshold: 20 },
    ],
    tools: [
      { id: 'mt1', name: 'Máquina de Fusão', condition: 'Good' },
      { id: 'mt4', name: 'Power Meter', condition: 'Good' },
    ],
    defects: ["Luz de freio queimada"],
  },
   {
    id: 'v3',
    name: 'Viatura 03 - Charlie',
    operatorIds: ['u4'],
    plate: 'QWE-9101',
    type: 'Poda',
    materials: [
      { id: 'mm4', name: 'Caixa de Emenda Óptica', quantity: 12, unit: 'unidades', threshold: 5 },
      { id: 'mm5', name: 'Protetores de Emenda', quantity: 250, unit: 'unidades', threshold: 50 },
      { id: 'mm6', name: 'Álcool Isopropílico', quantity: 2, unit: 'litros', threshold: 1 },
    ],
    tools: [
      { id: 'mt1', name: 'Máquina de Fusão', condition: 'Good' },
      { id: 'mt5', name: 'Fonte de Luz Óptica', condition: 'Broken' },
      { id: 'mt6', name: 'Identificador de Fibra Ativa', condition: 'Good' },
    ],
    defects: [],
  },
];

const initialMasterMaterials: MasterMaterial[] = [
    { id: 'mm1', name: 'Cabos de Fibra Óptica', unit: 'metros' },
    { id: 'mm2', name: 'Conectores SC/APC', unit: 'unidades' },
    { id: 'mm3', name: 'Fita Isolante', unit: 'rolos' },
    { id: 'mm4', name: 'Caixa de Emenda Óptica', unit: 'unidades' },
    { id: 'mm5', name: 'Protetores de Emenda', unit: 'unidades' },
    { id: 'mm6', name: 'Álcool Isopropílico', unit: 'litros' },
];

const initialMasterTools: MasterTool[] = [
    { id: 'mt1', name: 'Máquina de Fusão' },
    { id: 'mt2', name: 'Clivador de Precisão' },
    { id: 'mt3', name: 'Alicate de Corte' },
    { id: 'mt4', name: 'Power Meter' },
    { id: 'mt5', name: 'Fonte de Luz Óptica' },
    { id: 'mt6', name: 'Identificador de Fibra Ativa' },
];


const App: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
        const saved = localStorage.getItem('app_vehicles');
        return saved ? JSON.parse(saved) : initialVehicles;
    });
    const [users, setUsers] = useState<User[]>(() => {
        const saved = localStorage.getItem('app_users');
        return saved ? JSON.parse(saved) : initialUsers;
    });
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('app_userPermissions');
        return saved ? JSON.parse(saved) : {};
    });
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const saved = localStorage.getItem('app_notifications');
        if (saved) {
            const parsed = JSON.parse(saved) as (Omit<Notification, 'timestamp'> & { timestamp: string })[];
            return parsed.map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
        }
        return [];
    });
    const [masterMaterials, setMasterMaterials] = useState<MasterMaterial[]>(() => {
        const saved = localStorage.getItem('app_masterMaterials');
        return saved ? JSON.parse(saved) : initialMasterMaterials;
    });
    const [masterTools, setMasterTools] = useState<MasterTool[]>(() => {
        const saved = localStorage.getItem('app_masterTools');
        return saved ? JSON.parse(saved) : initialMasterTools;
    });

    useEffect(() => { localStorage.setItem('app_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
    useEffect(() => { localStorage.setItem('app_users', JSON.stringify(users)); }, [users]);
    useEffect(() => { localStorage.setItem('app_userPermissions', JSON.stringify(userPermissions)); }, [userPermissions]);
    useEffect(() => { localStorage.setItem('app_notifications', JSON.stringify(notifications)); }, [notifications]);
    useEffect(() => { localStorage.setItem('app_masterMaterials', JSON.stringify(masterMaterials)); }, [masterMaterials]);
    useEffect(() => { localStorage.setItem('app_masterTools', JSON.stringify(masterTools)); }, [masterTools]);


    const logActivity = (log: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...log,
            id: `notif-${Date.now()}`,
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    };
    
    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleRequestAccess = (userId: string, vehicleId: string) => {
        const user = users.find(u => u.id === userId);
        const vehicle = vehicles.find(v => v.id === vehicleId);

        if (user && vehicle) {
             const requestNotification: Omit<Notification, 'id' | 'timestamp' | 'read'> = {
                type: 'request',
                message: `${user.name} solicitou acesso à viatura ${vehicle.name}.`,
                vehicleId: vehicleId,
                vehicleName: vehicle.name,
                userId: userId,
            };
            logActivity(requestNotification);
        }
    };

    const handleApproveAccess = (notificationId: string) => {
        const notif = notifications.find(n => n.id === notificationId);
        if (notif && notif.userId) {
            handleAssignVehicleToUser(notif.userId, notif.vehicleId);

            setNotifications(prev => prev.map(n => 
                n.id === notificationId 
                ? { ...n, read: true, type: 'update', message: `Acesso de ${users.find(u => u.id === notif.userId)?.name} à ${notif.vehicleName} aprovado.` } 
                : n
            ));
        }
    };

    const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
        setVehicles(prevVehicles =>
            prevVehicles.map(v => (v.id === updatedVehicle.id ? updatedVehicle : v))
        );
    };
    
    const handleAddVehicle = (vehicleData: { name: string; plate: string; type: VehicleType }) => {
        const newVehicle: Vehicle = {
            ...vehicleData,
            id: `v-${Date.now()}`,
            operatorIds: [],
            materials: [],
            tools: [],
            defects: [],
        };
        setVehicles(prev => [...prev, newVehicle]);
    };

    const handleEditVehicle = (vehicleData: Pick<Vehicle, 'id' | 'name' | 'plate' | 'type'>) => {
        setVehicles(prev =>
            prev.map(v =>
                v.id === vehicleData.id
                    ? { ...v, name: vehicleData.name, plate: vehicleData.plate, type: vehicleData.type }
                    : v
            )
        );
    };

    const handleAssignVehicleToUser = (userId: string, newVehicleId: string | null) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return;

        const oldVehicleId = userToUpdate.assignedVehicleId;
        
        if (oldVehicleId === newVehicleId) return;

        if (newVehicleId) {
            const newVehicle = vehicles.find(v => v.id === newVehicleId);
            if (newVehicle && newVehicle.operatorIds.length >= 3 && !newVehicle.operatorIds.includes(userId)) {
                alert(`Cannot assign to "${newVehicle.name}". The vehicle already has 3 operators.`);
                return;
            }
        }

        setVehicles(prevVehicles =>
            prevVehicles.map(vehicle => {
                if (vehicle.id === oldVehicleId) {
                    return { ...vehicle, operatorIds: vehicle.operatorIds.filter(id => id !== userId) };
                }
                if (vehicle.id === newVehicleId) {
                    // Avoid adding duplicate operator ID
                    const newOperatorIds = vehicle.operatorIds.includes(userId) ? vehicle.operatorIds : [...vehicle.operatorIds, userId];
                    return { ...vehicle, operatorIds: newOperatorIds };
                }
                return vehicle;
            })
        );

        setUsers(prevUsers =>
            prevUsers.map(user =>
                user.id === userId ? { ...user, assignedVehicleId: newVehicleId || undefined } : user
            )
        );
    };

    const handleReportDefect = (vehicleId: string, defect: string) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle && currentUser) {
            const updatedVehicle = { ...vehicle, defects: [...vehicle.defects, defect] };
            handleUpdateVehicle(updatedVehicle);
            logActivity({
                type: 'alert',
                message: `${currentUser.name} relatou uma avaria: "${defect}"`,
                vehicleId: vehicleId,
                vehicleName: vehicle.name,
                itemType: 'vehicle'
            });
        }
    };

    const handleResolveDefect = (vehicleId: string, defectIndex: number) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle && currentUser) {
            const defectDescription = vehicle.defects[defectIndex];
            const updatedDefects = vehicle.defects.filter((_, index) => index !== defectIndex);
            const updatedVehicle = { ...vehicle, defects: updatedDefects };
            handleUpdateVehicle(updatedVehicle);
             logActivity({
                type: 'update',
                message: `${currentUser.name} resolveu a avaria: "${defectDescription}"`,
                vehicleId: vehicleId,
                vehicleName: vehicle.name,
                itemType: 'vehicle'
            });
        }
    };

    const handleLogin = (username: string, password: string): boolean => {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };
    
    const handleRegisterUser = (userData: Pick<User, 'name' | 'username' | 'password'>): { success: boolean; message: string } => {
        if (users.some(u => u.username === userData.username)) {
            return { success: false, message: 'Matrícula já existe. Por favor, escolha outra.' };
        }
        const newUser: User = {
            ...userData,
            id: `u-${Date.now()}`,
            role: 'operator',
        };
        setUsers(prev => [...prev, newUser]);
        return { success: true, message: 'Cadastro realizado com sucesso!' };
    };


    const handlePermissionChange = (userId: string, canEdit: boolean) => {
        setUserPermissions(prev => ({ ...prev, [userId]: canEdit }));
    };

    // Master Catalog Handlers
    const handleAddMasterMaterial = (data: Omit<MasterMaterial, 'id'>) => {
        const newMasterMaterial: MasterMaterial = { ...data, id: `mm-${Date.now()}`};
        setMasterMaterials(prev => [...prev, newMasterMaterial]);
    };

    const handleEditMasterMaterial = (data: MasterMaterial) => {
        setMasterMaterials(prev => prev.map(m => m.id === data.id ? data : m));
    };

    const handleDeleteMasterMaterial = (id: string) => {
        setMasterMaterials(prev => prev.filter(m => m.id !== id));
    };

    const handleAddMasterTool = (data: Omit<MasterTool, 'id'>) => {
        const newMasterTool: MasterTool = { ...data, id: `mt-${Date.now()}`};
        setMasterTools(prev => [...prev, newMasterTool]);
    };

    const handleEditMasterTool = (data: MasterTool) => {
        setMasterTools(prev => prev.map(t => t.id === data.id ? data : t));
    };

    const handleDeleteMasterTool = (id: string) => {
        setMasterTools(prev => prev.filter(t => t.id !== id));
    };


    if (!currentUser) {
        return (
            <HashRouter>
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} onRegister={handleRegisterUser} />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </HashRouter>
        );
    }
    
    return (
        <HashRouter>
            <Routes>
                {currentUser.role === 'admin' ? (
                    <>
                        <Route path="/admin" element={
                            <AdminDashboard 
                                vehicles={vehicles} 
                                users={users}
                                permissions={userPermissions}
                                onPermissionChange={handlePermissionChange}
                                onLogout={handleLogout}
                                currentUser={currentUser}
                                notifications={notifications}
                                onAssignVehicle={handleAssignVehicleToUser}
                                onAddVehicle={handleAddVehicle}
                                onEditVehicle={handleEditVehicle}
                                masterMaterials={masterMaterials}
                                masterTools={masterTools}
                                onAddMasterMaterial={handleAddMasterMaterial}
                                onEditMasterMaterial={handleEditMasterMaterial}
                                onDeleteMasterMaterial={handleDeleteMasterMaterial}
                                onAddMasterTool={handleAddMasterTool}
                                onEditMasterTool={handleEditMasterTool}
                                onDeleteMasterTool={handleDeleteMasterTool}
                                onApproveAccess={handleApproveAccess}
                                onMarkAllAsRead={handleMarkAllAsRead}
                            />} 
                        />
                        <Route path="/vehicle/:id" element={
                            <VehicleDetail 
                                vehicles={vehicles} 
                                updateVehicle={handleUpdateVehicle}
                                logActivity={logActivity}
                                notifications={notifications}
                                canEdit={true} // Admin can always edit
                                onLogout={handleLogout}
                                currentUser={currentUser}
                                users={users}
                                masterMaterials={masterMaterials}
                                masterTools={masterTools}
                                onRequestAccess={handleRequestAccess}
                                onReportDefect={handleReportDefect}
                                onResolveDefect={handleResolveDefect}
                            />}
                        />
                        <Route path="*" element={<Navigate to="/admin" />} />
                    </>
                ) : ( // Operator role
                    <>
                        <Route path="/" element={
                            <Home
                                vehicles={vehicles}
                                currentUser={currentUser}
                                onSelectVehicle={handleAssignVehicleToUser}
                                onLogout={handleLogout}
                                users={users}
                            />
                        }/>
                        <Route path="/vehicle/:id" element={
                            <VehicleDetail
                                vehicles={vehicles}
                                updateVehicle={handleUpdateVehicle}
                                logActivity={logActivity}
                                notifications={notifications}
                                canEdit={userPermissions[currentUser.id] !== false} // Default to true unless explicitly set to false
                                onLogout={handleLogout}
                                currentUser={currentUser}
                                users={users}
                                masterMaterials={masterMaterials}
                                masterTools={masterTools}
                                onRequestAccess={handleRequestAccess}
                                onReportDefect={handleReportDefect}
                                onResolveDefect={handleResolveDefect}
                            />
                        }/>
                        <Route path="*" element={<Navigate to="/" />} />
                    </>
                )}
            </Routes>
        </HashRouter>
    );
};

export default App;
