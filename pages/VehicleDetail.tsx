import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Vehicle, Material, Tool, ToolCondition, User, Notification, MasterMaterial, MasterTool } from '../types';
import { BoxIcon, WrenchIcon, PlusIcon, MinusIcon, LogoutIcon, LockClosedIcon, ClockIcon, ArrowPathIcon, SearchIcon, ExclamationTriangleIcon, CogIcon } from '../components/icons';
import { Modal } from '../components/Modal';
import { UseMaterialModal } from '../components/UseMaterialModal';
import { AddMaterialModal } from '../components/AddMaterialModal';
import { DefectReportModal } from '../components/DefectReportModal';

type ViewType = 'materials' | 'tools';

interface VehicleDetailProps {
  vehicles: Vehicle[];
  updateVehicle: (updatedVehicle: Vehicle) => Promise<void>;
  logActivity: (log: Omit<Notification, 'id' | 'timestamp' | 'read' | 'created_at'>) => Promise<void>;
  notifications: Notification[];
  canEdit: boolean;
  onLogout: () => void;
  currentUser: User;
  users: User[];
  masterMaterials: MasterMaterial[];
  masterTools: MasterTool[];
  onRequestAccess: (userId: string, vehicleId: string) => Promise<void>;
  onReportDefect: (vehicleId: string, defect: string) => Promise<void>;
  onResolveDefect: (vehicleId: string, defectIndex: number) => Promise<void>;
}

const VehicleDetail: React.FC<VehicleDetailProps> = (props) => {
  const { 
    vehicles, updateVehicle, logActivity, notifications, canEdit, 
    onLogout, currentUser, users, masterMaterials, masterTools,
    onRequestAccess, onReportDefect, onResolveDefect
  } = props;
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewType>('materials');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [materialToUse, setMaterialToUse] = useState<Material | null>(null);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [materialToAddStock, setMaterialToAddStock] = useState<Material | null>(null);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  
  const [newMaterialData, setNewMaterialData] = useState({ masterId: '', quantity: '', threshold: '5' });
  const [newToolData, setNewToolData] = useState({ masterId: '', condition: 'Good' as ToolCondition });
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [requestSent, setRequestSent] = useState(false);


  const vehicle = useMemo(() => vehicles.find(v => v.id === id), [vehicles, id]);

  const assignedOperators = useMemo(() => {
    if (!vehicle) return [];
    return users.filter(u => vehicle.operatorIds.includes(u.id));
  }, [users, vehicle]);
  
  const vehicleActivity = useMemo(() => {
    if (!vehicle) return [];
    return notifications
        .filter(n => n.vehicleId === vehicle.id && n.type === 'update')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
  }, [notifications, vehicle]);

  const filteredMaterials = useMemo(() => {
    if (!vehicle) return [];
    if (!materialSearchQuery) return vehicle.materials;
    return vehicle.materials.filter(material =>
      material.name.toLowerCase().includes(materialSearchQuery.toLowerCase())
    );
  }, [vehicle, materialSearchQuery]);

  const addableMaterials = useMemo(() => {
    if (!vehicle) return [];
    const vehicleMaterialIds = vehicle.materials.map(m => m.id);
    return masterMaterials.filter(mm => !vehicleMaterialIds.includes(mm.id));
  }, [masterMaterials, vehicle]);

  const addableTools = useMemo(() => {
    if (!vehicle) return [];
    const vehicleToolIds = vehicle.tools.map(t => t.id);
    return masterTools.filter(mt => !vehicleToolIds.includes(mt.id));
  }, [masterTools, vehicle]);

  useEffect(() => {
    if (addableMaterials.length > 0) {
        setNewMaterialData(prev => ({...prev, masterId: addableMaterials[0].id}));
    }
    if (addableTools.length > 0) {
        setNewToolData(prev => ({...prev, masterId: addableTools[0].id}));
    }
  }, [addableMaterials, addableTools]);

  const handleRequestAccessClick = async () => {
      if (id) {
        await onRequestAccess(currentUser.id, id);
        setRequestSent(true);
      }
  };
  
  const handleReportDefectConfirm = async (defect: string) => {
    if (vehicle) {
        await onReportDefect(vehicle.id, defect);
        setIsDefectModalOpen(false);
    }
  }

  if (!vehicle) {
    return <div className="p-8 text-center text-red-500">Viatura não encontrada.</div>;
  }
   if (currentUser.role === 'operator' && currentUser.assignedVehicleId !== id) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-md p-8 text-center bg-white rounded-xl shadow-lg">
                <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-red-500" />
                <h2 className="mt-4 text-2xl font-bold text-dark">Acesso Negado</h2>
                <p className="mt-2 text-slate-600">
                    Você não tem permissão para acessar os detalhes desta viatura.
                </p>
                {requestSent && (
                    <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm" role="alert">
                        Sua solicitação foi enviada a um administrador e será analisada.
                    </div>
                )}
                <div className="mt-6 w-full space-y-3">
                    <button
                        onClick={handleRequestAccessClick}
                        disabled={requestSent}
                        className="w-full py-3 font-semibold text-white transition-colors bg-secondary rounded-lg hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {requestSent ? 'Solicitação Enviada' : 'Solicitar Acesso'}
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 font-semibold text-slate-700 transition-colors bg-slate-200 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        </div>
     );
   }

  const handleMaterialQuantityChange = async (material: Material, amount: number) => {
    if (!canEdit) return;
    const newQuantity = Math.max(0, material.quantity + amount);
    const updatedMaterials = vehicle.materials.map(m =>
      m.id === material.id ? { ...m, quantity: newQuantity } : m
    );
    
    const updatePromise = updateVehicle({ ...vehicle, materials: updatedMaterials });
    
    const action = amount > 0 ? 'adicionou' : 'usou';
    const logPromise = logActivity({
      type: 'update',
      message: `${currentUser.name} ${action} ${Math.abs(amount)} ${material.unit} de "${material.name}".`,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      itemType: 'material',
    });

    await Promise.all([updatePromise, logPromise]);

    if (newQuantity <= material.threshold) {
        await logActivity({
            type: 'alert',
            message: `Estoque Baixo: "${material.name}" está com ${newQuantity} ${material.unit}.`,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            itemType: 'material',
        });
    }
  };

  const handleConfirmUseMaterial = async (material: Material, quantityUsed: number) => {
    await handleMaterialQuantityChange(material, -quantityUsed);
    closeUseModal();
  };

  const handleConfirmAddStock = async (material: Material, quantityAdded: number) => {
    await handleMaterialQuantityChange(material, quantityAdded);
    closeAddStockModal();
  };
  
  const handleRemoveTool = async (tool: Tool) => {
    if (!canEdit) return;
    const updatedTools = vehicle.tools.filter(t => t.id !== tool.id);
    await updateVehicle({ ...vehicle, tools: updatedTools });

    await logActivity({
      type: 'update',
      message: `${currentUser.name} removeu a ferramenta "${tool.name}".`,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      itemType: 'tool',
    });
  };

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewMaterialData({ masterId: addableMaterials[0]?.id || '', quantity: '', threshold: '5' });
    setNewToolData({ masterId: addableTools[0]?.id || '', condition: 'Good' as ToolCondition });
  };

  const openUseModal = (material: Material) => {
    setMaterialToUse(material);
    setIsUseModalOpen(true);
  };

  const closeUseModal = () => {
    setMaterialToUse(null);
    setIsUseModalOpen(false);
  };

  const openAddStockModal = (material: Material) => {
    setMaterialToAddStock(material);
    setIsAddStockModalOpen(true);
  };

  const closeAddStockModal = () => {
    setMaterialToAddStock(null);
    setIsAddStockModalOpen(false);
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newMaterialData.masterId) return;

    const masterMat = masterMaterials.find(mm => mm.id === newMaterialData.masterId);
    if (!masterMat) return;

    const newMat: Material = {
        id: masterMat.id,
        name: masterMat.name,
        unit: masterMat.unit,
        quantity: parseInt(newMaterialData.quantity, 10),
        threshold: parseInt(newMaterialData.threshold, 10),
    };
    const updatePromise = updateVehicle({ ...vehicle, materials: [...vehicle.materials, newMat] });
    
    const logPromise = logActivity({
        type: 'update',
        message: `${currentUser.name} adicionou novo material "${newMat.name}".`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        itemType: 'material',
    });

    await Promise.all([updatePromise, logPromise]);
    
    if (newMat.quantity <= newMat.threshold) {
        await logActivity({
            type: 'alert',
            message: `Estoque Baixo: "${newMat.name}" está com ${newMat.quantity} ${newMat.unit}.`,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            itemType: 'material',
        });
    }
    closeAddModal();
  };

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newToolData.masterId) return;

    const masterTool = masterTools.find(mt => mt.id === newToolData.masterId);
    if (!masterTool) return;

    const newT: Tool = {
        id: masterTool.id,
        name: masterTool.name,
        condition: newToolData.condition,
    };
    await updateVehicle({ ...vehicle, tools: [...vehicle.tools, newT] });
    
    await logActivity({
        type: 'update',
        message: `${currentUser.name} adicionou nova ferramenta "${newT.name}".`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        itemType: 'tool',
    });
    closeAddModal();
  };

  const TabButton: React.FC<{ view: ViewType; label: string; icon: React.ReactNode; }> = ({ view, label, icon }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center justify-center w-full py-3 px-4 text-sm font-medium rounded-md transition-colors ${
        activeView === view
          ? 'bg-primary text-white shadow'
          : 'text-slate-600 hover:bg-slate-200'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100">
        <header className="bg-white shadow-sm sticky top-0 z-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-dark truncate">{vehicle.name}</h1>
                    <p className="text-slate-500 text-sm sm:text-base">
                        {vehicle.plate} - {assignedOperators.length > 0 ? assignedOperators.map(op => op.name).join(', ') : 'Nenhum Operador Atribuído'}
                    </p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    {currentUser.role === 'admin' ? (
                        <button onClick={() => navigate('/admin')} className="text-sm font-medium text-primary hover:underline whitespace-nowrap">
                            Painel
                        </button>
                    ) : (
                        <button onClick={() => navigate('/')} className="flex items-center text-sm font-medium text-primary hover:underline whitespace-nowrap">
                            <ArrowPathIcon className="w-5 h-5 sm:mr-1"/>
                            <span className="hidden sm:inline">Trocar Viatura</span>
                        </button>
                    )}
                    <button onClick={onLogout} className="flex items-center text-sm font-medium text-red-500 hover:text-red-700">
                        <LogoutIcon className="w-5 h-5 sm:mr-1"/>
                        <span className="hidden sm:inline">Sair</span>
                    </button>
                </div>
            </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {!canEdit && (
                <div className="flex items-center bg-amber-100 text-amber-800 p-4 rounded-lg text-sm">
                    <LockClosedIcon className="w-5 h-5 mr-3 flex-shrink-0"/>
                    Você está em modo de apenas leitura. Contate um administrador para permissões de edição.
                </div>
            )}
            
            <section className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                     <h2 className="text-xl font-semibold text-dark flex items-center">
                        <CogIcon className="w-6 h-6 mr-2 text-slate-400" />
                        Relatório de Viatura
                    </h2>
                    <button 
                        onClick={() => setIsDefectModalOpen(true)}
                        disabled={!canEdit}
                        className="flex items-center justify-center w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        <ExclamationTriangleIcon className="w-5 h-5 mr-1" />
                        Sinalizar Avaria
                    </button>
                </div>
                 <ul className="divide-y divide-slate-200">
                    {vehicle.defects.length > 0 ? vehicle.defects.map((defect, index) => (
                        <li key={index} className="p-4 flex items-center justify-between hover:bg-slate-50">
                            <p className="text-sm text-dark flex-1">{defect}</p>
                            {currentUser.role === 'admin' && (
                                <button 
                                onClick={() => onResolveDefect(vehicle.id, index)}
                                className="ml-4 text-xs font-semibold text-green-600 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-full">
                                    Marcar como Resolvido
                                </button>
                            )}
                        </li>
                    )) : (
                         <li className="p-6 text-center text-slate-500">
                           Nenhuma avaria sinalizada para esta viatura.
                       </li>
                    )}
                </ul>
            </section>
            
            <div className="bg-white p-4 rounded-lg shadow-md sticky top-[80px] sm:top-[88px] z-10">
                <div className="grid grid-cols-2 gap-4">
                    <TabButton view="materials" label="Materiais" icon={<BoxIcon className="w-5 h-5"/>} />
                    <TabButton view="tools" label="Ferramentas" icon={<WrenchIcon className="w-5 h-5"/>} />
                </div>
            </div>

            {vehicleActivity.length > 0 && (
                 <div>
                    <h3 className="text-lg font-semibold text-dark mb-3 flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2 text-slate-400" />
                        Atividade Recente
                    </h3>
                    <div className="bg-white rounded-lg shadow-md">
                        <ul className="divide-y divide-slate-200">
                            {vehicleActivity.map(notif => (
                                <li key={notif.id} className="p-3 flex items-start space-x-3">
                                    <div className="p-1">
                                        {notif.itemType === 'material' && <BoxIcon className="w-5 h-5 text-slate-400" />}
                                        {notif.itemType === 'tool' && <WrenchIcon className="w-5 h-5 text-slate-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-dark">{notif.message}</p>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-semibold capitalize flex-1">{activeView === 'materials' ? 'Inventário de Materiais' : 'Inventário de Ferramentas'}</h2>
                    <button 
                        onClick={openAddModal} 
                        disabled={!canEdit}
                        className="flex items-center justify-center w-full sm:w-auto bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                        aria-label={`Adicionar Novo ${activeView === 'materials' ? 'Material' : 'Ferramenta'}`}
                    >
                        <PlusIcon className="w-5 h-5 mr-1" />
                        Adicionar {activeView === 'materials' ? 'Material' : 'Ferramenta'}
                    </button>
                </div>
                {activeView === 'materials' && (
                    <div className="p-4 border-b border-slate-200">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar materiais por nome..."
                                value={materialSearchQuery}
                                onChange={(e) => setMaterialSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                aria-label="Buscar materiais"
                            />
                        </div>
                    </div>
                )}
                <ul className="divide-y divide-slate-200">
                    {activeView === 'materials' && filteredMaterials.map(mat => (
                        <li key={mat.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className={`font-medium truncate ${mat.quantity <= mat.threshold ? 'text-red-600' : 'text-dark'}`}>{mat.name}</p>
                                <p className="text-sm text-slate-500">
                                    {mat.quantity} {mat.unit} {mat.quantity <= mat.threshold && <span className="font-bold">(Estoque Baixo)</span>}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button onClick={() => openUseModal(mat)} disabled={!canEdit} className="px-3 py-1 text-sm font-medium bg-red-100 text-red-600 rounded-md hover:bg-red-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed">Usar</button>
                                <button onClick={() => openAddStockModal(mat)} disabled={!canEdit} className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"><PlusIcon className="w-4 h-4"/></button>
                            </div>
                        </li>
                    ))}
                    {activeView === 'materials' && filteredMaterials.length === 0 && (
                        <li className="p-6 text-center text-slate-500">
                            {vehicle.materials.length === 0 
                                ? 'Esta viatura não possui materiais.'
                                : `Nenhum material encontrado para "${materialSearchQuery}"`
                            }
                        </li>
                    )}
                    {activeView === 'tools' && vehicle.tools.map(tool => (
                        <li key={tool.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className="font-medium text-dark truncate">{tool.name}</p>
                                <p className={`text-sm font-semibold ${
                                    tool.condition === 'Good' ? 'text-green-600' : 
                                    tool.condition === 'Needs Repair' ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                    {tool.condition === 'Good' ? 'Bom' : tool.condition === 'Needs Repair' ? 'Requer Reparo' : 'Quebrado'}
                                </p>
                            </div>
                            <button onClick={() => handleRemoveTool(tool)} disabled={!canEdit} className="text-sm text-red-500 hover:underline disabled:text-slate-400 disabled:cursor-not-allowed disabled:no-underline flex-shrink-0">Remover</button>
                        </li>
                    ))}
                    {activeView === 'tools' && vehicle.tools.length === 0 && (
                        <li className="p-6 text-center text-slate-500">
                           Esta viatura não possui ferramentas.
                       </li>
                   )}
                </ul>
            </div>
        </main>

        <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title={`Adicionar ${activeView === 'materials' ? 'Material' : 'Ferramenta'} à Viatura`}>
            {activeView === 'materials' ? (
                <form onSubmit={handleAddMaterial} className="space-y-4">
                    {addableMaterials.length > 0 ? (
                        <>
                            <div>
                                <label htmlFor="material-select" className="block text-sm font-medium text-slate-700">Material</label>
                                <select id="material-select" value={newMaterialData.masterId} onChange={e => setNewMaterialData({...newMaterialData, masterId: e.target.value})} className="w-full p-2 border rounded bg-white mt-1" required>
                                    {addableMaterials.map(mat => <option key={mat.id} value={mat.id}>{mat.name} ({mat.unit})</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="material-quantity" className="block text-sm font-medium text-slate-700">
                                    Quantidade Inicial
                                </label>
                                <input
                                    type="number"
                                    id="material-quantity"
                                    placeholder="Ex: 100"
                                    value={newMaterialData.quantity}
                                    onChange={e => setNewMaterialData({...newMaterialData, quantity: e.target.value})}
                                    className="w-full p-2 border rounded mt-1"
                                    min="1"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="material-threshold" className="block text-sm font-medium text-slate-700">
                                    Alerta de Estoque Mínimo
                                </label>
                                <input
                                    type="number"
                                    id="material-threshold"
                                    placeholder="Ex: 5"
                                    value={newMaterialData.threshold}
                                    onChange={e => setNewMaterialData({...newMaterialData, threshold: e.target.value})}
                                    className="w-full p-2 border rounded mt-1"
                                    min="0"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-primary text-white p-2 rounded hover:bg-opacity-90">Adicionar Material</button>
                        </>
                    ) : (
                        <p className="text-center text-slate-500">Todos os materiais disponíveis já foram adicionados a esta viatura.</p>
                    )}
                </form>
            ) : (
                <form onSubmit={handleAddTool} className="space-y-4">
                    {addableTools.length > 0 ? (
                        <>
                            <select value={newToolData.masterId} onChange={e => setNewToolData({...newToolData, masterId: e.target.value})} className="w-full p-2 border rounded bg-white" required>
                               {addableTools.map(tool => <option key={tool.id} value={tool.id}>{tool.name}</option>)}
                            </select>
                            <select value={newToolData.condition} onChange={e => setNewToolData({...newToolData, condition: e.target.value as ToolCondition})} className="w-full p-2 border rounded bg-white">
                                <option value="Good">Bom</option>
                                <option value="Needs Repair">Requer Reparo</option>
                                <option value="Broken">Quebrado</option>
                            </select>
                            <button type="submit" className="w-full bg-primary text-white p-2 rounded hover:bg-opacity-90">Adicionar Ferramenta</button>
                        </>
                     ) : (
                        <p className="text-center text-slate-500">Todas as ferramentas disponíveis já foram adicionadas a esta viatura.</p>
                    )}
                </form>
            )}
        </Modal>
        
        <UseMaterialModal 
            isOpen={isUseModalOpen}
            onClose={closeUseModal}
            material={materialToUse}
            onConfirm={handleConfirmUseMaterial}
        />

        <AddMaterialModal 
            isOpen={isAddStockModalOpen}
            onClose={closeAddStockModal}
            material={materialToAddStock}
            onConfirm={handleConfirmAddStock}
        />
        
        <DefectReportModal
            isOpen={isDefectModalOpen}
            onClose={() => setIsDefectModalOpen(false)}
            onConfirm={handleReportDefectConfirm}
        />
    </div>
  );
};

export default VehicleDetail;