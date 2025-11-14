import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Vehicle, Notification, VehicleType, MasterMaterial, MasterTool } from './types';
import { supabase } from './supabaseClient';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

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
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (sessionData.session) {
                    await fetchAllData(sessionData.session);
                }
            } catch (error) {
                console.error("Error fetching initial data: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                setSession(session);
                if (event === 'SIGNED_IN' && session) {
                    await fetchAllData(session);
                }
                if (event === 'SIGNED_OUT') {
                    setCurrentUser(null);
                    setVehicles([]);
                    setUsers([]);
                    setNotifications([]);
                    // etc.
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);
    
    useEffect(() => {
        // Setup realtime subscriptions
        const channels = supabase.channel('db-changes');
        
        channels
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, payload => {
                console.log('Change received for vehicles!', payload);
                fetchVehicles();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
                console.log('Change received for users!', payload);
                fetchUsers();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
                 console.log('Change received for notifications!', payload);
                fetchNotifications();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'master_materials' }, payload => {
                 console.log('Change received for master_materials!', payload);
                fetchMasterMaterials();
            })
             .on('postgres_changes', { event: '*', schema: 'public', table: 'master_tools' }, payload => {
                 console.log('Change received for master_tools!', payload);
                fetchMasterTools();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    }, []);

    const fetchVehicles = async () => {
        const { data, error } = await supabase.from('vehicles').select('*');
        if (error) console.error('Error fetching vehicles', error);
        else setVehicles(data || []);
    };
    const fetchUsers = async () => {
        const { data, error } = await supabase.from('users').select('*');
        if (error) console.error('Error fetching users', error);
        else setUsers(data || []);
    };
    const fetchNotifications = async () => {
        const { data, error } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
        if (error) console.error('Error fetching notifications', error);
        else setNotifications(data || []);
    };
    const fetchMasterMaterials = async () => {
        const { data, error } = await supabase.from('master_materials').select('*');
        if (error) console.error('Error fetching master materials', error);
        else setMasterMaterials(data || []);
    };
    const fetchMasterTools = async () => {
        const { data, error } = await supabase.from('master_tools').select('*');
        if (error) console.error('Error fetching master tools', error);
        else setMasterTools(data || []);
    };

    const fetchAllData = async (session: Session) => {
        if (!session) return;
        setIsLoading(true);
        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
            if (userError) throw userError;
            
            setCurrentUser(userData);

            await Promise.all([
                fetchVehicles(),
                fetchUsers(),
                fetchNotifications(),
                fetchMasterMaterials(),
                fetchMasterTools()
            ]);
            
        } catch (error) {
            console.error("Error fetching all data: ", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const logActivity = async (log: Omit<Notification, 'id' | 'timestamp' | 'read' | 'created_at'>) => {
        const newNotification = {
            ...log,
            timestamp: new Date().toISOString(),
            read: false,
        };
        const { error } = await supabase.from('notifications').insert([newNotification]);
        if (error) console.error("Error logging activity: ", error);
    };

    const handleMarkAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
            if (error) console.error("Error marking all as read: ", error);
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
        const notif = notifications.find(n => n.id === notificationId);
        if (notif && notif.userId) {
            await handleAssignVehicleToUser(notif.userId, notif.vehicleId);
            
            const { error } = await supabase.from('notifications').update({
                 read: true,
                 type: 'update',
                 message: `Acesso de ${users.find(u => u.id === notif.userId)?.name} à ${notif.vehicleName} aprovado.`
            }).eq('id', notificationId);
            if (error) console.error("Error approving access: ", error);
        }
    };
    
    const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
        const { error } = await supabase.from('vehicles').update(updatedVehicle).eq('id', updatedVehicle.id);
        if (error) console.error("Error updating vehicle: ", error);
    };

    const handleAddVehicle = async (vehicleData: { name: string; plate: string; type: VehicleType }) => {
        const newVehicle: Omit<Vehicle, 'id' | 'created_at'> = {
            ...vehicleData,
            operatorIds: [],
            materials: [],
            tools: [],
            defects: [],
        };
        const { error } = await supabase.from('vehicles').insert([newVehicle]);
        if (error) console.error("Error adding vehicle: ", error);
    };

    const handleEditVehicle = async (vehicleData: Pick<Vehicle, 'id' | 'name' | 'plate' | 'type'>) => {
        const { error } = await supabase.from('vehicles').update({ name: vehicleData.name, plate: vehicleData.plate, type: vehicleData.type }).eq('id', vehicleData.id);
        if (error) console.error("Error editing vehicle: ", error);
    };

    const handleAssignVehicleToUser = async (userId: string, newVehicleId: string | null) => {
        // This is complex and needs a transaction, best handled by a Supabase Function (Edge Function)
        // For client-side simulation:
        // 1. Update user's assignedVehicleId
        const { error: userUpdateError } = await supabase.from('users').update({ assignedVehicleId: newVehicleId }).eq('id', userId);
        if (userUpdateError) {
            console.error("Error assigning vehicle to user: ", userUpdateError);
            return;
        }

        // 2. Remove user from all vehicle operator arrays
        const { data: allVehicles, error: fetchError } = await supabase.from('vehicles').select('id, operatorIds');
        if(fetchError) { console.error("Error fetching vehicles for assignment: ", fetchError); return; }

        for (const v of allVehicles || []) {
            if (v.operatorIds.includes(userId)) {
                const updatedOperatorIds = v.operatorIds.filter(id => id !== userId);
                const { error: vehicleUpdateError } = await supabase.from('vehicles').update({ operatorIds: updatedOperatorIds }).eq('id', v.id);
                if (vehicleUpdateError) console.error("Error removing user from old vehicle: ", vehicleUpdateError);
            }
        }
        
        // 3. Add user to the new vehicle's operator array
        if (newVehicleId) {
            const targetVehicle = vehicles.find(v => v.id === newVehicleId);
            if (targetVehicle && targetVehicle.operatorIds.length < 3) {
                 const updatedOperatorIds = [...targetVehicle.operatorIds, userId];
                 const { error: vehicleUpdateError } = await supabase.from('vehicles').update({ operatorIds: updatedOperatorIds }).eq('id', newVehicleId);
                 if (vehicleUpdateError) console.error("Error adding user to new vehicle: ", vehicleUpdateError);
            } else if (targetVehicle) {
                alert(`Não é possível atribuir a "${targetVehicle.name}". A viatura já tem 3 operadores.`);
                // Revert user assignment
                 await supabase.from('users').update({ assignedVehicleId: null }).eq('id', userId);
            }
        }
    };
    
    const handleReportDefect = async (vehicleId: string, defect: string) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle && currentUser) {
            const updatedDefects = [...vehicle.defects, defect];
            await handleUpdateVehicle({ ...vehicle, defects: updatedDefects });
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
        // Note: Permissions are not stored in the DB in this simplified schema.
        // This remains a client-side simulation. For a real app, you'd need a permissions table or RLS policies.
        setUserPermissions(prev => ({ ...prev, [userId]: canEdit }));
    };

    const handleAddMasterMaterial = async (data: Omit<MasterMaterial, 'id'>) => {
        const { error } = await supabase.from('master_materials').insert([data]);
        if (error) console.error("Error adding master material: ", error);
    };
    const handleEditMasterMaterial = async (data: MasterMaterial) => {
        const { error } = await supabase.from('master_materials').update({ name: data.name, unit: data.unit }).eq('id', data.id);
        if (error) console.error("Error editing master material: ", error);
    };
    const handleDeleteMasterMaterial = async (id: string) => {
        const { error } = await supabase.from('master_materials').delete().eq('id', id);
        if (error) console.error("Error deleting master material: ", error);
    };
    const handleAddMasterTool = async (data: Omit<MasterTool, 'id'>) => {
        const { error } = await supabase.from('master_tools').insert([data]);
        if (error) console.error("Error adding master tool: ", error);
    };
    const handleEditMasterTool = async (data: MasterTool) => {
        const { error } = await supabase.from('master_tools').update({ name: data.name }).eq('id', data.id);
        if (error) console.error("Error editing master tool: ", error);
    };
    const handleDeleteMasterTool = async (id: string) => {
        const { error } = await supabase.from('master_tools').delete().eq('id', id);
        if (error) console.error("Error deleting master tool: ", error);
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center font-bold text-lg text-primary">Carregando...</div>;
    }

    if (!session || !currentUser) {
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
                                permissions={userPermissions} // Still mock
                                onPermissionChange={handlePermissionChange}
                                onLogout={() => supabase.auth.signOut()}
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
                                onLogout={() => supabase.auth.signOut()}
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
                                onLogout={() => supabase.auth.signOut()}
                                users={users}
                            />
                        }/>
                        <Route path="/vehicle/:id" element={
                            <VehicleDetail
                                vehicles={vehicles}
                                updateVehicle={handleUpdateVehicle}
                                logActivity={logActivity}
                                notifications={notifications}
                                canEdit={userPermissions[currentUser.id] !== false} // Mock
                                onLogout={() => supabase.auth.signOut()}
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
