import React, { useState } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail,
    updateProfile,
    browserLocalPersistence,
    setPersistence
} from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { UserIcon, LockClosedIcon, EnvelopeIcon } from '../components/icons';

type View = 'login' | 'register' | 'forgotPassword';

const Login: React.FC = () => {
    const [view, setView] = useState<View>('login');
    
    // Common states
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Login states
    const [loginMatricula, setLoginMatricula] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginAttempts, setLoginAttempts] = useState(0);

    // Register states
    const [regName, setRegName] = useState('');
    const [regMatricula, setRegMatricula] = useState('');
    const [regUserEmail, setRegUserEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    
    // Forgot Password state
    const [forgotEmail, setForgotEmail] = useState('');

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const emailForAuth = `${loginMatricula}@nucleo.app`;
            await setPersistence(auth, browserLocalPersistence);
            await signInWithEmailAndPassword(auth, emailForAuth, loginPassword);
            // Navigation will be handled by the onAuthStateChanged listener in App.tsx
        } catch (err: any) {
            const newAttemptCount = loginAttempts + 1;
            setLoginAttempts(newAttemptCount);
            if (newAttemptCount >= 3) {
                 setError('Matrícula ou senha inválida. Considere redefinir sua senha.');
            } else {
                 setError('Matrícula ou senha inválida.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(regUserEmail)) {
            setError('Por favor, insira um endereço de e-mail válido.');
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        setIsLoading(true);
        
        try {
            const emailForAuth = `${regMatricula}@nucleo.app`;
            const userCredential = await createUserWithEmailAndPassword(auth, emailForAuth, regPassword);
            const user = userCredential.user;

            await updateProfile(user, { displayName: regName });
            
            await setDoc(doc(db, 'users', user.uid), {
                name: regName,
                username: regMatricula,
                email: regUserEmail,
                role: 'operator',
                assignedVehicleId: null,
            });

            setMessage('Cadastro realizado com sucesso! Você já pode fazer o login.');
            
            setTimeout(() => {
                setRegName('');
                setRegMatricula('');
                setRegUserEmail('');
                setRegPassword('');
                setRegConfirmPassword('');
                setView('login');
                setMessage('');
                setError('');
            }, 2000);

        } catch (err: any) {
             if (err.code === 'auth/email-already-in-use') {
                setError('Esta matrícula já está em uso.');
            } else if (err.code === 'auth/weak-password') {
                setError('A senha deve ter no mínimo 6 caracteres.');
            } else {
                setError('Ocorreu um erro ao registrar. Tente novamente.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);
        try {
            // Find the user's matricula based on their email to construct the auth email
            const q = query(collection(db, "users"), where("email", "==", forgotEmail));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setError("Nenhuma conta encontrada com este endereço de e-mail.");
                setIsLoading(false);
                return;
            }

            const userData = querySnapshot.docs[0].data();
            const matricula = userData.username;
            const emailForAuth = `${matricula}@nucleo.app`;
            
            await sendPasswordResetEmail(auth, emailForAuth);
            setMessage('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
        } catch (error) {
            console.error("Error sending password reset email", error);
            setError('Não foi possível enviar o e-mail. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const switchView = (newView: View) => {
        setView(newView);
        setError('');
        setMessage('');
        setLoginAttempts(0);
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
                                <input type="email" value={regUserEmail} onChange={(e) => setRegUserEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="E-mail" required />
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
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon className="w-5 h-5 text-slate-400" /></span>
                                <input type="text" value={loginMatricula} onChange={(e) => setLoginMatricula(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Matrícula" required />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="w-5 h-5 text-slate-400" /></span>
                                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 text-gray-800 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Senha" required />
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
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg">
                {(error || message) && (
                    <div className={`text-center text-sm p-3 rounded-md ${error ? 'text-red-500 bg-red-100' : 'text-green-500 bg-green-100'}`}>
                        {error || message}
                    </div>
                )}
                {renderForm()}
            </div>
        </div>
    );
};

export default Login;