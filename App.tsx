import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { User, Vehicle, Notification, VehicleType, MasterMaterial, MasterTool } from './types';
import { auth, db } from './firebaseClient';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import AdminDashboard from './pages/AdminDashboard';
import VehicleDetail from './pages/VehicleDetail';
import Login from './pages/Login';
import Home from './pages/Home';
import { ExclamationTriangleIcon } from './components/icons';

const App: React.FC = () => {
    // Verifica se a configuração do Firebase foi preenchida.
    if (!auth || !db) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100 p-4">
                <div className="max-w-lg w-full text-center bg-white p-8 rounded-xl shadow-2xl border-t-4 border-red-500">
                    <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-red-500" />
                    <h1 className="text-2xl font-bold text-dark mt-4 mb-2">Configuração Incompleta</h1>
                    <p className="text-slate-600 mb-6">
                        As credenciais do Firebase não foram configuradas. Para que o aplicativo funcione,
                        é necessário inserir a configuração do seu projeto.
                    </p>
                    <div className="bg-slate-100 p-4 rounded-lg text-left">
                        <p className="text-sm font-semibold text-slate-800">Passos:</p>
                        <ol className="list-decimal list-inside text-sm text-slate-700 mt-2 space-y-1">
                            <li>Abra o arquivo <code className="bg-slate-200 text-sm p-1 rounded mx-1 font-mono">firebaseClient.ts</code> no editor.</li>
                            <li>Substitua os valores de exemplo no objeto <code className="bg-slate-200 text-sm p-1 rounded mx-1 font-mono">firebaseConfig</code>.</li>
                        </ol>
                         <p className="mt-3 text-xs text-slate-500">
                            Você pode encontrar essa configuração no console do Firebase, em <strong>Project Settings &gt; General</strong>.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [masterMaterials, setMasterMaterials] = useState<MasterMaterial[]>([]);
    const [masterTools, setMasterTools] = useState<MasterTool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setFirebaseUser(user);
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setCurrentUser(userDocSnap.data() as User);
                }
            } else {
                setFirebaseUser(null);
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (!db) return;
        // Configura listeners em tempo real para todas as coleções
        const collections: { name: string; setter: Function }[] = [
            { name: 'vehicles', setter: setVehicles },
            { name: 'users', setter: setUsers },
            { name: 'notifications', setter: setNotifications },
            { name: 'master_materials', setter: setMasterMaterials },
            { name: 'master_tools', setter: setMasterTools },
        ];

        const unsubscribers = collections.map(({ name, setter }) => {
            const q = query(collection(db, name));
            return onSnapshot(q, (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setter(data);
            });
        });

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, []);
    
    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        setCurrentUser(null);
    };

    const logActivity = async (log: Omit<Notification, 'id' | 'timestamp' | 'read' | 'created_at'>) => {
        if (!db) return;
        const newNotification = {
            ...log,
            timestamp: new Date().toISOString(),
            read: false,
        };
        try {
            await addDoc(collection(db, 'notifications'), newNotification);
        } catch (error) {
            console.error("Error logging activity: ", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!db) return;
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            const batch = writeBatch(db);
            unreadIds.forEach(id => {
                const notifRef = doc(db, 'notifications', id);
                batch.update(notifRef, { read: true });
            });
            await batch.commit();
        }
    };

    const handleRequestAccess = async (userId: string, vehicleId: string) => {
        const user = users.find(u => u.id === userId);
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (user && vehicle) {
            await logActivity({
                type: 'request',
                message: `${user.name} solicitou acesso à viatura ${vehicle.name}.`,
                vehicleId: vehicleId,
                vehicleName: vehicle.name,
                userId: userId,
            });
        }
    };
    
    const handleApproveAccess = async (notificationId: string) => {
        if (!db) return;
        const notif = notifications.find(n => n.id === notificationId);
        if (notif && notif.userId) {
            await handleAssignVehicleToUser(notif.userId, notif.vehicleId);
            
            const notifRef = doc(db, 'notifications', notificationId);
            await updateDoc(notifRef, {
                 read: true,
                 type: 'update',
                 message: `Acesso de ${users.find(u => u.id === notif.userId)?.name} à ${notif.vehicleName} aprovado.`
            });
        }
    };

    const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
        if (!db) return;
        const vehicleRef = doc(db, 'vehicles', updatedVehicle.id);
        const { id, ...vehicleData } = updatedVehicle;
        await updateDoc(vehicleRef, vehicleData);
    };

    const handleAddVehicle = async (vehicleData: { name: string; plate: string; type: VehicleType }) => {
        if (!db) return;
        const newVehicle: Omit<Vehicle, 'id' | 'created_at'> = {
            ...vehicleData,
            operatorIds: [],
            materials: [],
            tools: [],
            defects: [],
        };
        await addDoc(collection(db, 'vehicles'), newVehicle);
    };

    const handleEditVehicle = async (vehicleData: Pick<Vehicle, 'id' | 'name' | 'plate' | 'type'>) => {
        if (!db) return;
        const vehicleRef = doc(db, 'vehicles', vehicleData.id);
        await updateDoc(vehicleRef, { name: vehicleData.name, plate: vehicleData.plate, type: vehicleData.type });
    };

    const handleAssignVehicleToUser = async (userId: string, newVehicleId: string | null) => {
        if (!db) return;
        const batch = writeBatch(db);
        const userRef = doc(db, "users", userId);
        batch.update(userRef, { assignedVehicleId: newVehicleId });

        // Remove from old vehicle
        const oldVehicle = vehicles.find(v => v.operatorIds.includes(userId));
        if(oldVehicle){
            const oldVehicleRef = doc(db, 'vehicles', oldVehicle.id);
            batch.update(oldVehicleRef, { operatorIds: arrayRemove(userId) });
        }

        // Add to new vehicle
        if (newVehicleId) {
            const newVehicle = vehicles.find(v => v.id === newVehicleId);
            if (newVehicle && newVehicle.operatorIds.length < 3) {
                 const newVehicleRef = doc(db, 'vehicles', newVehicleId);
                 batch.update(newVehicleRef, { operatorIds: arrayUnion(userId) });
            } else if (newVehicle) {
                alert(`Não é possível atribuir a "${newVehicle.name}". A viatura já tem 3 operadores.`);
                return; // Do not commit batch
            }
        }
        await batch.commit();
    };

    const handleReportDefect = async (vehicleId: string, defect: string) => {
        if (!db || !currentUser) return;
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        await updateDoc(vehicleRef, { defects: arrayUnion(defect) });
        
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            await logActivity({
                type: 'alert',
                message: `${currentUser.name} relatou uma avaria: "${defect}"`,
                vehicleId: vehicleId,
                vehicleName: vehicle.name,
                itemType: 'vehicle'
            });
        }
    };

    const handleResolveDefect = async (vehicleId: string, defectIndex: number) => {
        if (!db || !currentUser) return;
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            const defectDescription = vehicle.defects[defectIndex];
            const updatedDefects = vehicle.defects.filter((_, index) => index !== defectIndex);
            await handleUpdateVehicle({ ...vehicle, defects: updatedDefects });
            await logActivity({
                type: 'update',
                message: `${currentUser.name} resolveu a avaria: "${defectDescription}"`,
                vehicleId: vehicleId,
                vehicleName: vehicle.name,
                itemType: 'vehicle'
            });
        }
    };
    
    const handlePermissionChange = async (userId: string, canEdit: boolean) => {
        setUserPermissions(prev => ({ ...prev, [userId]: canEdit }));
    };

    const handleAddMasterMaterial = async (data: Omit<MasterMaterial, 'id'>) => {
        if (!db) return;
        await addDoc(collection(db, 'master_materials'), data);
    };
    const handleEditMasterMaterial = async (data: MasterMaterial) => {
        if (!db) return;
        const { id, ...rest } = data;
        await updateDoc(doc(db, 'master_materials', id), rest);
    };
    const handleDeleteMasterMaterial = async (id: string) => {
        if (!db) return;
        await deleteDoc(doc(db, 'master_materials', id));
    };
    const handleAddMasterTool = async (data: Omit<MasterTool, 'id'>) => {
        if (!db) return;
        await addDoc(collection(db, 'master_tools'), data);
    };
    const handleEditMasterTool = async (data: MasterTool) => {
        if (!db) return;
        const { id, ...rest } = data;
        await updateDoc(doc(db, 'master_tools', id), rest);
    };
    const handleDeleteMasterTool = async (id: string) => {
        if (!db) return;
        await deleteDoc(doc(db, 'master_tools', id));
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center font-bold text-lg text-primary">Carregando...</div>;
    }

    if (!firebaseUser || !currentUser) {
        return <Login />;
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
                                canEdit={true}
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
                                canEdit={userPermissions[currentUser.id] !== false}
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
