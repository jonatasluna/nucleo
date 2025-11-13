import React, { useState } from 'react';
import { UserIcon, LockClosedIcon } from '../components/icons';
import { User } from '../types';

interface LoginProps {
    onLogin: (username: string, password: string) => boolean;
    onRegister: (userData: Pick<User, 'name' | 'username' | 'password'>) => { success: boolean; message: string };
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    
    // Login states
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Register states
    const [regName, setRegName] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regMessage, setRegMessage] = useState({ type: '', text: '' });

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onLogin(username, password);
        if (!success) {
            setError('Matrícula ou senha inválida.');
        }
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!regName || !regUsername || !regPassword) {
            setRegMessage({ type: 'error', text: 'Por favor, preencha todos os campos.' });
            return;
        }
        const result = onRegister({ name: regName, username: regUsername, password: regPassword });
        if (result.success) {
            setRegMessage({type: '', text: ''});
            setError(result.message + ' Agora você pode fazer login.');
            // Clear fields and switch to login view
            setRegName('');
            setRegUsername('');
            setRegPassword('');
            setIsRegistering(false);
        } else {
            setRegMessage({ type: 'error', text: result.message });
        }
    };
    
    const toggleView = () => {
        setIsRegistering(!isRegistering);
        // Clear all messages and errors when switching
        setError('');
        setRegMessage({type: '', text: ''});
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-dark mb-2">
                        {isRegistering ? 'Criar Conta' : 'Núcleo'}
                    </h1>
                    <p className="text-slate-500">
                        {isRegistering ? 'Junte-se à equipe criando uma conta de operador.' : 'Faça login no Núcleo para continuar'}
                    </p>
                </div>

                {isRegistering ? (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        {regMessage.text && <p className={`text-center text-sm ${regMessage.type === 'error' ? 'text-red-500 bg-red-100' : 'text-green-500 bg-green-100'} p-3 rounded-md`}>{regMessage.text}</p>}
                         <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                            </span>
                            <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Nome Completo" required />
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                            </span>
                            <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Matricula" required />
                        </div>
                        <div className="relative">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockClosedIcon className="w-5 h-5 text-slate-400" />
                            </span>
                            <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Senha de Rede" required />
                        </div>
                        <button type="submit" className="w-full py-3 font-semibold text-white transition-colors bg-primary rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            Registrar
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                        {error && <p className="text-center text-sm text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
                        <div className="relative">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                            </span>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Matricula" required />
                        </div>
                        <div className="relative">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockClosedIcon className="w-5 h-5 text-slate-400" />
                            </span>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Senha de Rede" required />
                        </div>
                        <button type="submit" className="w-full py-3 font-semibold text-white transition-colors bg-primary rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            Entrar
                        </button>
                        <div className="text-center text-xs text-slate-400 space-y-1 pt-2">
                            <p className="font-bold">Dicas de login:</p>
                            <p>Admin: admin / admin</p>
                            <p>Operador: user1 / user1</p>
                        </div>
                    </form>
                )}
                 <div className="text-center text-sm">
                    <span className="text-slate-500">
                        {isRegistering ? 'Já tem uma conta?' : "Não tem uma conta?"}
                    </span>
                    <button onClick={toggleView} className="ml-1 font-medium text-primary hover:underline focus:outline-none">
                        {isRegistering ? 'Entrar' : 'Registrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;