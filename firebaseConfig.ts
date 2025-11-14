import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Cole aqui as credenciais do seu projeto Firebase.
// Você pode encontrar essas informações no console do Firebase,
// nas configurações do seu projeto (Project Settings > General).
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};


// Validação para garantir que as credenciais foram substituídas.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
  console.error("Configuração do Firebase está incompleta. Substitua os valores de placeholder em 'firebaseConfig.ts' pelas credenciais do seu projeto.");
}


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços do Firebase para serem usados em todo o aplicativo
export const auth = getAuth(app);
export const db = getFirestore(app);
