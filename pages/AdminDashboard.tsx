import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle, User, Notification, VehicleType, MasterMaterial, MasterTool } from '../types';
import { TruckIcon, BoxIcon, WrenchIcon, UserIcon, LogoutIcon, BellIcon, ExclamationTriangleIcon, PlusIcon, PencilIcon, TrashIcon, UserPlusIcon, CogIcon, ArrowPathIcon, SearchIcon } from '../components/icons';
import { VehicleModal } from '../components/VehicleModal';
import { MasterItemModal } from '../components/MasterItemModal';
import { ConfirmationModal } from '../components/ConfirmationModal';


interface AdminDashboardProps {
  vehicles: Vehicle[];
  users: User[];
  permissions: Record<string, boolean>;
  notifications: Notification[];
  onPermissionChange: (userId: string, canEdit: boolean) => Promise<void>;
  onLogout: () => void;
  currentUser: User;
  onAssignVehicle: (userId: string, vehicleId: string | null) => Promise<void>;
  onAddVehicle: (vehicleData: { name: string; plate: string; type: VehicleType }) => Promise<void>;
  onEditVehicle: (vehicleData: Pick<Vehicle, 'id' | 'name' | 'plate' | 'type'>) => Promise<void>;
  masterMaterials: MasterMaterial[];
  masterTools: MasterTool[];
  onAddMasterMaterial: (data: Omit<MasterMaterial, 'id'>) => Promise<void>;
  onEditMasterMaterial: (data: MasterMaterial) => Promise<void>;
  onDeleteMasterMaterial: (id: string) => Promise<void>;
  onAddMasterTool: (data: Omit<MasterTool, 'id'>) => Promise<void>;
  onEditMasterTool: (data: MasterTool) => Promise<void>;
  onDeleteMasterTool: (id: string) => Promise<void>;
  onApproveAccess: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

const typeColors: Record<VehicleType, string> = {
    Poda: 'bg-green-100 text-green-800',
    Prontidão: 'bg-blue-100 text-blue-800',
    Comercial: 'bg-purple-100 text-purple-800',
};

const VehicleCard: React.FC<{ vehicle: Vehicle; users: User[], onEdit: (vehicle: Vehicle) => void }> = ({ vehicle, users, onEdit }) => {
    const lowStockMaterials = vehicle.materials.filter(m => m.quantity <= m.threshold).length;
    const toolsNeedingRepair = vehicle.tools.filter(t => t.condition !== 'Good').length;
    const vehicleDefects = vehicle.defects.length;
    const hasDefects = vehicleDefects > 0;
    const assignedOperators = users.filter(u => vehicle.operatorIds.includes(u.id));
  
    return (
        <div className={`bg-white rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative ${hasDefects ? 'border-2 border-red-500' : ''}`}>
            <button 
                onClick={(e) => { e.preventDefault(); onEdit(vehicle); }}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-secondary hover:text-white transition-colors z-10"
                aria-label="Editar Viatura"
            >
                <PencilIcon className="w-4 h-4" />
            </button>
            <Link 
                to={`/vehicle/${vehicle.id}`}
                className="flex flex-col flex-grow"
            >
                <div className={`p-5 border-b ${hasDefects ? 'border-red-200' : 'border-slate-200'} ${hasDefects ? 'bg-red-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${hasDefects ? 'bg-red-100' : 'bg-green-100'}`}>
                            <TruckIcon className={`w-6 h-6 ${hasDefects ? 'text-red-600' : 'text-primary'}`}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-dark">{vehicle.name}</h3>
                            <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                                <p className="text-slate-500 text-sm">{vehicle.plate}</p>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${typeColors[vehicle.type]}`}>
                                    {vehicle.type}
                                </span>
                                {hasDefects && (
                                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-600 text-white flex items-center">
                                        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                        AVARIADO
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-5 space-y-4 flex-grow">
                <div className="flex items-start text-slate-600">
                    <UserIcon className="w-5 h-5 mr-3 text-slate-400 mt-1 flex-shrink-0" />
                    <div>
                    {assignedOperators.length > 0 ? (
                        assignedOperators.map(op => <span key={op.id} className="block">{op.name}</span>)
                    ) : (
                        <span className="text-slate-400 italic">Nenhum operador atribuído</span>
                    )}
                    </div>
                </div>
                <div className="flex items-center text-slate-600">
                    <BoxIcon className="w-5 h-5 mr-3 text-slate-400" />
                    <span>{vehicle.materials.length} Tipos de Materiais</span>
                </div>
                <div className="flex items-center text-slate-600">
                    <WrenchIcon className="w-5 h-5 mr-3 text-slate-400" />
                    <span>{vehicle.tools.length} Ferramentas</span>
                </div>
                </div>
                <div className="p-5 border-t border-slate-200 mt-auto">
                    {lowStockMaterials > 0 || toolsNeedingRepair > 0 || vehicleDefects > 0 ? (
                        <div className="flex items-center text-sm font-semibold flex-wrap gap-2">
                            {lowStockMaterials > 0 && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">{lowStockMaterials} em baixo estoque</span>}
                            {toolsNeedingRepair > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{toolsNeedingRepair} com avaria</span>}
                            {vehicleDefects > 0 && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center"><ExclamationTriangleIcon className="w-4 h-4 mr-1"/> {vehicleDefects} avaria(s)</span>}
                        </div>
                    ) : (
                        <p className="text-sm text-green-600 font-semibold">Inventário OK</p>
                    )}
                </div>
                <div className="bg-slate-50 p-3 text-center text-sm font-medium text-secondary rounded-b-lg group-hover:bg-secondary group-hover:text-white transition-colors">
                    Ver Detalhes
                </div>
            </Link>
        </div>
    );
};

const NotificationPanel: React.FC<{ notifications: Notification[]; onClose?: () => void }> = ({ notifications, onClose }) => {
    const sortedNotifications = [...notifications].sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

    const getIcon = (notif: Notification) => {
        switch (notif.type) {
            case 'alert':
                return <ExclamationTriangleIcon className="w-6 h-6 text-red-500"/>;
            case 'request':
                return <UserPlusIcon className="w-6 h-6 text-blue-500"/>;
            case 'update':
                if (notif.itemType === 'material') return <BoxIcon className="w-6 h-6 text-slate-500" />;
                if (notif.itemType === 'tool') return <WrenchIcon className="w-6 h-6 text-slate-500" />;
                if (notif.itemType === 'vehicle') return <TruckIcon className="w-6 h-6 text-slate-500" />;
                return <ArrowPathIcon className="w-6 h-6 text-slate-500"/>;
            default:
                return null;
        }
    };

    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-20 border border-slate-200 animate-fade-in-down">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-lg font-semibold text-dark">Notificações</h4>
            </div>
            <ul className="divide-y divide-slate-200 max-h-[60vh] overflow-y-auto">
                {sortedNotifications.length > 0 ? sortedNotifications.slice(0, 15).map(notif => (
                     <li key={notif.id}>
                        <Link 
                            to={`/vehicle/${notif.vehicleId}`} 
                            onClick={onClose}
                            className={`p-4 flex items-start space-x-3 transition-colors hover:bg-slate-50`}
                        >
                            <div className="flex-shrink-0 mt-1">
                                {getIcon(notif)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-dark">{notif.message}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    <span className="font-medium">{notif.vehicleName}</span> - {notif.timestamp.toDate().toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                                </p>
                            </div>
                        </Link>
                    </li>
                )) : (
                    <li className="p-8 text-center text-slate-500">Nenhuma notificação recente.</li>
                )}
            </ul>
            <style>{`
                @keyframes fade-in-down {
                    0% {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};


const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { 
    vehicles, users, permissions, notifications, onPermissionChange, onLogout, currentUser, 
    onAssignVehicle, onAddVehicle, onEditVehicle, masterMaterials, masterTools,
    onAddMasterMaterial, onEditMasterMaterial, onDeleteMasterMaterial,
    onAddMasterTool, onEditMasterTool, onDeleteMasterTool, onApproveAccess,
    onMarkAllAsRead
  } = props;
  
  const [isLoading, setIsLoading] = useState(false);
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState<MasterMaterial | MasterTool | null>(null);
  const [masterItemType, setMasterItemType] = useState<'material' | 'tool'>('material');
  const [catalogView, setCatalogView] = useState<'materials' | 'tools'>('materials');
  const [notificationFilter, setNotificationFilter] = useState('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'all' | VehicleType>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  const toggleNotificationPanel = async () => {
      const newOpenState = !isNotificationPanelOpen;
      setIsNotificationPanelOpen(newOpenState);
      if (newOpenState && unreadNotifications > 0) {
          await onMarkAllAsRead();
      }
  };

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
              setIsNotificationPanelOpen(false);
          }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [notificationPanelRef]);

  const filteredVehicles = useMemo(() => {
    if (vehicleTypeFilter === 'all') {
      return vehicles;
    }
    return vehicles.filter(v => v.type === vehicleTypeFilter);
  }, [vehicles, vehicleTypeFilter]);
  
  const filteredOperatorUsers = useMemo(() => {
    const operators = users.filter(u => u.role === 'operator');
    if (!userSearchQuery) {
        return operators;
    }
    return operators.filter(user =>
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  }, [users, userSearchQuery]);


  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (vehicleData: { name: string; plate: string; type: VehicleType } & { id?: string }) => {
    setIsLoading(true);
    try {
        if (editingVehicle) {
            await onEditVehicle({ ...vehicleData, id: editingVehicle.id });
        } else {
            await onAddVehicle(vehicleData);
        }
    } catch (error) {
        console.error("Failed to save vehicle:", error);
        alert("Falha ao salvar viatura.");
    } finally {
        setIsLoading(false);
        setIsVehicleModalOpen(false);
    }
  };

  const handleOpenAddMasterModal = () => {
    setEditingMasterItem(null);
    setMasterItemType(catalogView === 'materials' ? 'material' : 'tool');
    setIsMasterModalOpen(true);
  };

  const handleOpenEditMasterModal = (item: MasterMaterial | MasterTool) => {
    setEditingMasterItem(item);
    setMasterItemType(catalogView === 'materials' ? 'material' : 'tool');
    setIsMasterModalOpen(true);
  };

  const handleSaveMasterItem = async (data: { name: string, unit?: string } & { id?: string }) => {
    setIsLoading(true);
    try {
        if (catalogView === 'materials') {
            const materialData = { id: data.id, name: data.name, unit: data.unit || 'unidades' };
            if (editingMasterItem) await onEditMasterMaterial(materialData as MasterMaterial);
            else await onAddMasterMaterial(materialData);
        } else {
            const toolData = { id: data.id, name: data.name };
            if (editingMasterItem) await onEditMasterTool(toolData as MasterTool);
            else await onAddMasterTool(toolData);
        }
    } catch (error) {
        console.error("Failed to save master item:", error);
        alert("Falha ao salvar item do catálogo.");
    } finally {
        setIsLoading(false);
        setIsMasterModalOpen(false);
    }
  }

  const handleDeleteMasterItem = (id: string) => {
      setItemToDelete(id);
      setIsConfirmDeleteModalOpen(true);
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    try {
        if (catalogView === 'materials') {
          await onDeleteMasterMaterial(itemToDelete);
        } else {
          await onDeleteMasterTool(itemToDelete);
        }
    } catch(error) {
        console.error("Failed to delete master item:", error);
        alert("Falha ao excluir item do catálogo.");
    } finally {
        setIsLoading(false);
        setIsConfirmDeleteModalOpen(false);
        setItemToDelete(null);
    }
  };
  
  const filteredNotifications = notifications.filter(notif =>
    notificationFilter === 'all' || notif.vehicleId === notificationFilter
  );

  const FilterButton: React.FC<{ type: 'all' | VehicleType, label: string }> = ({ type, label }) => (
    <button
      onClick={() => setVehicleTypeFilter(type)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        vehicleTypeFilter === type ? 'bg-primary text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );


  return (
    <div className="min-h-screen bg-slate-100">
        <header className="bg-white shadow-sm sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                     <h1 className="text-2xl font-bold text-dark truncate">Painel Administrativo</h1>
                     <p className="text-sm text-slate-500">Bem-vindo(a), {currentUser.name}!</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative" ref={notificationPanelRef}>
                       <button 
                          onClick={toggleNotificationPanel} 
                          className="relative p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full"
                          aria-label="Ver notificações"
                        >
                           <BellIcon className="w-6 h-6 text-slate-500" />
                           {unreadNotifications > 0 && (
                               <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white ring-2 ring-white">
                                   {unreadNotifications}
                               </span>
                           )}
                       </button>
                       {isNotificationPanelOpen && (
                           <NotificationPanel notifications={notifications} onClose={() => setIsNotificationPanelOpen(false)} />
                       )}
                    </div>
                    <button onClick={onLogout} className="flex items-center text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
                        <LogoutIcon className="w-5 h-5 sm:mr-1" />
                        <span className="hidden sm:inline">Sair</span>
                    </button>
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-10">
                    <section>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                            <h2 className="text-2xl font-semibold text-dark">Visão Geral das Viaturas</h2>
                             <div className="p-1 bg-slate-200 rounded-lg flex items-center space-x-1">
                                <FilterButton type="all" label="Todos" />
                                <FilterButton type="Poda" label="Poda" />
                                <FilterButton type="Prontidão" label="Prontidão" />
                                <FilterButton type="Comercial" label="Comercial" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
                            {filteredVehicles.map(vehicle => (
                                <VehicleCard key={vehicle.id} vehicle={vehicle} users={users} onEdit={handleOpenEditModal} />
                            ))}
                        </div>
                         <div className="mt-6 text-right">
                             <button
                                onClick={handleOpenAddModal}
                                className="inline-flex items-center bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary transition-colors"
                            >
                                <PlusIcon className="w-5 h-5 mr-1" />
                                Adicionar Viatura
                            </button>
                        </div>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-semibold text-dark mb-4">Gerenciamento do Catálogo</h2>
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="p-2 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2">
                                <button onClick={() => setCatalogView('materials')} className={`py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center transition-colors ${catalogView === 'materials' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
                                    <BoxIcon className="w-5 h-5 mr-2" /> Materiais
                                </button>
                                <button onClick={() => setCatalogView('tools')} className={`py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center transition-colors ${catalogView === 'tools' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
                                    <WrenchIcon className="w-5 h-5 mr-2" /> Ferramentas
                                </button>
                            </div>
                            <div className="p-4 flex justify-end">
                                <button onClick={handleOpenAddMasterModal} className="flex items-center bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary transition-colors">
                                    <PlusIcon className="w-5 h-5 mr-1" /> Adicionar Novo {catalogView === 'materials' ? 'Material' : 'Ferramenta'}
                                </button>
                            </div>
                            <ul className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                                {catalogView === 'materials' && masterMaterials.map(item => (
                                    <li key={item.id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-dark">{item.name}</p>
                                            <p className="text-sm text-slate-500">{item.unit}</p>
                                        </div>
                                        <div className="space-x-2">
                                            <button onClick={() => handleOpenEditMasterModal(item)} className="p-2 text-slate-500 hover:text-primary"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteMasterItem(item.id)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </li>
                                ))}
                                {catalogView === 'tools' && masterTools.map(item => (
                                    <li key={item.id} className="p-4 flex items-center justify-between">
                                        <p className="font-semibold text-dark">{item.name}</p>
                                        <div className="space-x-2">
                                            <button onClick={() => handleOpenEditMasterModal(item)} className="p-2 text-slate-500 hover:text-primary"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteMasterItem(item.id)} className="p-2 text-slate-500 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-dark mb-4">Permissões e Atribuições</h2>
                        <div className="bg-white rounded-lg shadow-md">
                             <div className="p-4 border-b border-slate-200">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SearchIcon className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar operador por nome..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        aria-label="Buscar operadores"
                                    />
                                </div>
                            </div>
                            <ul className="divide-y divide-slate-200">
                                {filteredOperatorUsers.length > 0 ? filteredOperatorUsers.map(user => {
                                    const canEdit = permissions[user.id] !== false;
                                    return (
                                        <li key={user.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="font-semibold text-dark">{user.name}</p>
                                                <div className="flex items-center mt-2">
                                                    <label htmlFor={`assign-${user.id}`} className="text-sm text-slate-500 mr-2 whitespace-nowrap">Atribuído a:</label>
                                                    <select
                                                        id={`assign-${user.id}`}
                                                        value={user.assignedVehicleId || ''}
                                                        onChange={(e) => onAssignVehicle(user.id, e.target.value || null)}
                                                        className="bg-slate-100 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-1.5 w-full sm:w-auto"
                                                    >
                                                        <option value="">Não atribuído</option>
                                                        {vehicles.map(v => (
                                                            <option key={v.id} value={v.id} disabled={v.operatorIds.length >= 3 && !v.operatorIds.includes(user.id)}>
                                                                {v.name} {v.operatorIds.length >= 3 && !v.operatorIds.includes(user.id) ? '(Cheia)' : `(${v.operatorIds.length}/3)`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center mt-2 sm:mt-0">
                                                <span className={`text-sm font-medium mr-3 ${canEdit ? 'text-green-600' : 'text-slate-500'}`}>
                                                    {canEdit ? 'Pode Editar' : 'Somente Leitura'}
                                                </span>
                                                <label htmlFor={`permission-${user.id}`} className="flex items-center cursor-pointer">
                                                    <div className="relative">
                                                        <input 
                                                            id={`permission-${user.id}`} 
                                                            type="checkbox" 
                                                            className="sr-only" 
                                                            checked={canEdit}
                                                            onChange={(e) => onPermissionChange(user.id, e.target.checked)}
                                                        />
                                                        <div className={`block w-14 h-8 rounded-full transition ${canEdit ? 'bg-primary' : 'bg-slate-300'}`}></div>
                                                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${canEdit ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                    </div>
                                                </label>
                                            </div>
                                        </li>
                                    );
                                }) : (
                                    <li className="p-6 text-center text-slate-500">
                                        Nenhum operador encontrado.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </section>
                </div>
                
                <aside className="lg:col-span-1">
                    <h2 className="text-2xl font-semibold text-dark mb-4">Atividade Recente e Alertas</h2>
                    
                    <div className="bg-white rounded-lg shadow-md mb-4 sticky top-[88px] z-10">
                        <div className="p-4">
                            <label htmlFor="vehicle-filter" className="block text-sm font-medium text-slate-700 mb-1">
                                Filtrar por Viatura
                            </label>
                            <select
                                id="vehicle-filter"
                                value={notificationFilter}
                                onChange={(e) => setNotificationFilter(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                            >
                                <option value="all">Todas as Viaturas</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md max-h-[70vh] overflow-y-auto">
                        {filteredNotifications.length > 0 ? (
                            <ul className="divide-y divide-slate-200">
                                {filteredNotifications.map(notif => (
                                    <li key={notif.id} className={`p-4 ${notif.type === 'alert' ? 'bg-red-50' : (notif.type === 'request' ? 'bg-blue-50' : '')}`}>
                                        <div className="flex items-start space-x-3">
                                            {notif.type === 'alert' && <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5"/>}
                                            {notif.type === 'request' && <UserPlusIcon className="w-5 h-5 text-blue-500 mt-0.5"/>}
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${notif.type === 'alert' ? 'text-red-800' : (notif.type === 'request' ? 'text-blue-800' : 'text-dark')}`}>{notif.message}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {notif.vehicleName} - {notif.timestamp.toDate().toLocaleString()}
                                                </p>
                                                {notif.type === 'request' && !notif.read && (
                                                    <button 
                                                        onClick={() => onApproveAccess(notif.id)}
                                                        className="mt-2 px-3 py-1 text-xs font-semibold text-white bg-primary rounded-md hover:bg-secondary transition-colors"
                                                    >
                                                        Aprovar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-slate-500">
                                <p>Nenhuma atividade para a viatura selecionada.</p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </main>
        <VehicleModal 
            isOpen={isVehicleModalOpen}
            onClose={() => setIsVehicleModalOpen(false)}
            onSave={handleSaveVehicle}
            vehicle={editingVehicle}
        />
        <MasterItemModal
            isOpen={isMasterModalOpen}
            onClose={() => setIsMasterModalOpen(false)}
            onSave={handleSaveMasterItem}
            item={editingMasterItem}
            itemType={masterItemType}
        />
        <ConfirmationModal
            isOpen={isConfirmDeleteModalOpen}
            onClose={() => setIsConfirmDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Excluir Item do Catálogo"
            message="Você tem certeza que deseja excluir este item permanentemente?"
        />
    </div>
  );
};

export default AdminDashboard;