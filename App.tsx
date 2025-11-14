
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { Vehicle, User, Notification, VehicleType, MasterMaterial, MasterTool } from './types';
import AdminDashboard from './pages/AdminDashboard';
import VehicleDetail from './pages/VehicleDetail';
import Login from './pages/Login';
import Home from './pages/Home';

const App: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [masterMaterials, setMasterMaterials] = useState<MasterMaterial[]>([]);
    const [masterTools, setMasterTools] = useState<MasterTool[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setCurrentUser({ id: userDocSnap.id, ...userDocSnap.data() } as User);
                } else {
                    // This could be a new registration, App.tsx will handle creating the user doc
                }
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        // Setup Firestore listeners
        const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
        });

        const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersData);
        });

        const unsubMaterials = onSnapshot(collection(db, 'masterMaterials'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MasterMaterial));
            setMasterMaterials(data);
        });

        const unsubTools = onSnapshot(collection(db, 'masterTools'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MasterTool));
            setMasterTools(data);
        });
        
        const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
             const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
             setNotifications(data);
        });
        
        const unsubPermissions = onSnapshot(collection(db, 'permissions'), (snapshot) => {
             let permissionsData: Record<string, boolean> = {};
             snapshot.docs.forEach(doc => {
                 permissionsData[doc.id] = doc.data().canEdit;
             });
             setUserPermissions(permissionsData);
        });


        return () => {
            unsubscribeAuth();
            unsubVehicles();
            unsubUsers();
            unsubMaterials();
            unsubTools();
            unsubNotifications();
            unsubPermissions();
        };
    }, []);
    

    const logActivity = async (log: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification = {
            ...log,
            timestamp: Timestamp.now(),
            read: false,
        };
        await addDoc(collection(db, 'notifications'), newNotification);
    };
    
    const handleMarkAllAsRead = async () => {
        const batch = writeBatch(db);
        const unreadNotifs = notifications.filter(n => !n.read);
        unreadNotifs.forEach(notif => {
            const notifRef = doc(db, 'notifications', notif.id);
            batch.update(notifRef, { read: true });
        });
        await batch.commit();
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
        const notif = notifications.find(n => n.id === notificationId);
        if (notif && notif.userId) {
            await handleAssignVehicleToUser(notif.userId, notif.vehicleId);
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true,
                type: 'update',
                message: `Acesso de ${users.find(u => u.id === notif.userId)?.name} à ${notif.vehicleName} aprovado.`
            });
        }
    };

    const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
        const vehicleRef = doc(db, 'vehicles', updatedVehicle.id);
        await setDoc(vehicleRef, updatedVehicle, { merge: true });
    };
    
    const handleAddVehicle = async (vehicleData: { name: string; plate: string; type: VehicleType }) => {
        await addDoc(collection(db, 'vehicles'), {
            ...vehicleData,
            operatorIds: [],
            materials: [],
            tools: [],
            defects: [],
        });
    };

    const handleEditVehicle = async (vehicleData: Pick<Vehicle, 'id' | 'name' | 'plate' | 'type'>) => {
        const vehicleRef = doc(db, 'vehicles', vehicleData.id);
        await updateDoc(vehicleRef, {
            name: vehicleData.name,
            plate: vehicleData.plate,
            type: vehicleData.type
        });
    };

    const handleAssignVehicleToUser = async (userId: string, newVehicleId: string | null) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return;
        const oldVehicleId = userToUpdate.assignedVehicleId;
        if (oldVehicleId === newVehicleId) return;

        const batch = writeBatch(db);

        // Update user's assigned vehicle
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, { assignedVehicleId: newVehicleId || null });

        // Remove from old vehicle's operators
        if (oldVehicleId) {
            const oldVehicleRef = doc(db, 'vehicles', oldVehicleId);
            const oldVehicle = vehicles.find(v => v.id === oldVehicleId);
            if(oldVehicle) {
                batch.update(oldVehicleRef, { operatorIds: oldVehicle.operatorIds.filter(id => id !== userId) });
            }
        }

        // Add to new vehicle's operators
        if (newVehicleId) {
            const newVehicleRef = doc(db, 'vehicles', newVehicleId);
            const newVehicle = vehicles.find(v => v.id === newVehicleId);
             if (newVehicle && newVehicle.operatorIds.length >= 3 && !newVehicle.operatorIds.includes(userId)) {
                alert(`Não é possível atribuir a "${newVehicle.name}". A viatura já tem 3 operadores.`);
                return;
            }
            if(newVehicle && !newVehicle.operatorIds.includes(userId)) {
                batch.update(newVehicleRef, { operatorIds: [...newVehicle.operatorIds, userId] });
            }
        }
        await batch.commit();
    };

    const handleReportDefect = async (vehicleId: string, defect: string) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle && currentUser) {
            const updatedVehicle = { ...vehicle, defects: [...vehicle.defects, defect] };
            await handleUpdateVehicle(updatedVehicle);
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
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle && currentUser) {
            const defectDescription = vehicle.defects[defectIndex];
            const updatedDefects = vehicle.defects.filter((_, index) => index !== defectIndex);
            const updatedVehicle = { ...vehicle, defects: updatedDefects };
            await handleUpdateVehicle(updatedVehicle);
            await logActivity({
                type: 'update',
                message: `${currentUser.name} resolveu a avaria: "${defectDescription}"`,
                vehicleId: vehicleId,
                vehicleName: vehicle.name,
                itemType: 'vehicle'
            });
        }
    };
    
    const handleLogout = async () => {
        await signOut(auth);
    };

    const handlePermissionChange = async (userId: string, canEdit: boolean) => {
        const permissionRef = doc(db, 'permissions', userId);
        await setDoc(permissionRef, { canEdit });
    };

    // Master Catalog Handlers
    const handleAddMasterMaterial = async (data: Omit<MasterMaterial, 'id'>) => {
        await addDoc(collection(db, 'masterMaterials'), data);
    };
    const handleEditMasterMaterial = async (data: MasterMaterial) => {
        await setDoc(doc(db, 'masterMaterials', data.id), data, { merge: true });
    };
    const handleDeleteMasterMaterial = async (id: string) => {
        await deleteDoc(doc(db, 'masterMaterials', id));
    };
    const handleAddMasterTool = async (data: Omit<MasterTool, 'id'>) => {
        await addDoc(collection(db, 'masterTools'), data);
    };
    const handleEditMasterTool = async (data: MasterTool) => {
        await setDoc(doc(db, 'masterTools', data.id), data, { merge: true });
    };
    const handleDeleteMasterTool = async (id: string) => {
        await deleteDoc(doc(db, 'masterTools', id));
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Carregando...</div>;
    }
    
    if (!auth.currentUser) {
        return (
            <HashRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </HashRouter>
        );
    }
    
    if (!currentUser) {
         return <div className="flex h-screen items-center justify-center">Verificando dados do usuário...</div>;
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
