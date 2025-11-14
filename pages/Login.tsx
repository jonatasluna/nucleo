import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserIcon, LockClosedIcon, EnvelopeIcon } from '../components/icons';

type View = 'login' | 'register' | 'forgotPassword';

const Login: React.FC = () => {
    const [view, setView] = useState<View>('login');
    
    // Common states
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Login states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Register states
    const [regName, setRegName] = useState('');
    const [regMatricula, setRegMatricula] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    
    // Forgot Password state
    const [forgotEmail, setForgotEmail] = useState('');

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error.message);
        }
        // onAuthStateChange in App.tsx will handle navigation
        setIsLoading(false);
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const matriculaRegex = /^\d{1,6}$/;
        if (!matriculaRegex.test(regMatricula)) {
            setError('A matrícula deve conter apenas números e ter no máximo 6 dígitos.');
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        setIsLoading(true);
        
        const { data, error } = await supabase.auth.signUp({
            email: regEmail,
            password: regPassword,
            options: {
                data: {
                    name: regName,
                    username: regMatricula,
                    role: 'operator' // Default role
                }
            }
        });

        if (error) {
            setError(error.message);
        } else if (data.user) {
             setMessage('Cadastro realizado! Por favor, verifique seu e-mail para confirmar sua conta.');
             // Clear form after a delay
             setTimeout(() => {
                setRegName('');
                setRegMatricula('');
                setRegEmail('');
                setRegPassword('');
                setRegConfirmPassword('');
                setView('login');
                setMessage('');
                setError('');
            }, 3000);
        }
        setIsLoading(false);
    };
    
    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);
        
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
            redirectTo: window.location.origin, // URL to redirect to after password reset
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Se uma conta com este e-mail existir, um link de redefinição foi enviado.');
        }
        setIsLoading(false);
    };
    
    const switchView = (newView: View) => {
        setView(newView);
        setError('');
        setMessage('');
    }
    
    const renderForm = () => {
        switch (view) {
            case 'register':
                return (
                    <>
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-dark mb-2">Criar Conta</h1>
                            <p className="text-slate-500">Junte-se à equipe criando uma conta de operador.</p>
                        </div>
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon className="w-5 h-5 text-slate-400" /></span>
                                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Nome Completo" required />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><EnvelopeIcon className="w-5 h-5 text-slate-400" /></span>
                                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="E-mail" required />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon className="w-5 h-5 text-slate-400" /></span>
                                <input type="text" value={regMatricula} onChange={(e) => setRegMatricula(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Matrícula (apenas números)" required maxLength={6} pattern="\d*" />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="w-5 h-5 text-slate-400" /></span>
                                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Senha" required />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="w-5 h-5 text-slate-400" /></span>
                                <input type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Confirmar Senha" required />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 font-semibold text-white transition-colors bg-primary rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-400">
                                {isLoading ? 'Registrando...' : 'Registrar'}
                            </button>
                        </form>
                        <div className="text-center text-sm">
                            <span className="text-slate-500">Já tem uma conta?</span>
                            <button onClick={() => switchView('login')} className="ml-1 font-medium text-primary hover:underline focus:outline-none">Entrar</button>
                        </div>
                    </>
                );
            case 'forgotPassword':
                return (
                     <>
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-dark mb-2">Recuperar Senha</h1>
                            <p className="text-slate-500">Insira seu e-mail de cadastro para receber um link de redefinição.</p>
                        </div>
                        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                             <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><EnvelopeIcon className="w-5 h-5 text-slate-400" /></span>
                                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Seu e-mail de cadastro" required />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 font-semibold text-white transition-colors bg-primary rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-400">
                                {isLoading ? 'Enviando...' : 'Enviar Link'}
                            </button>
                        </form>
                        <div className="text-center text-sm">
                            <span className="text-slate-500">Lembrou sua senha?</span>
                            <button onClick={() => switchView('login')} className="ml-1 font-medium text-primary hover:underline focus:outline-none">Fazer Login</button>
                        </div>
                    </>
                );
            default: // login view
                return (
                     <>
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-dark mb-2">Núcleo</h1>
                            <p className="text-slate-500">Faça login no Núcleo para continuar</p>
                        </div>
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><EnvelopeIcon className="w-5 h-5 text-slate-400" /></span>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="E-mail" required />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="w-5 h-5 text-slate-400" /></span>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Senha" required />
                            </div>
                             <div className="text-right text-sm">
                                <button type="button" onClick={() => switchView('forgotPassword')} className="font-medium text-primary hover:underline focus:outline-none">
                                    Esqueceu a senha?
                                </button>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3 font-semibold text-white transition-colors bg-primary rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-400">
                                 {isLoading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>
                        <div className="text-center text-sm">
                            <span className="text-slate-500">Não tem uma conta?</span>
                            <button onClick={() => switchView('register')} className="ml-1 font-medium text-primary hover:underline focus:outline-none">Registrar</button>
                        </div>
                    </>
                );
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
             <main className="w-full max-w-sm mx-auto">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-8">
                        {(error || message) && (
                            <div className={`text-center text-sm p-3 rounded-md mb-6 ${error ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'}`}>
                                {error || message}
                            </div>
                        )}
                        {renderForm()}
                    </div>
                </div>
             </main>
            <footer className="pt-8 text-center text-sm text-slate-500">
                Desenvolvido por Jonatas Luna - 347612
            </footer>
        </div>
    );
};

export default Login;