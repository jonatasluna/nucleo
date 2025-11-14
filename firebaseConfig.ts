import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// As credenciais do Firebase agora são carregadas de variáveis de ambiente
// para maior segurança. Certifique-se de criar um arquivo .env na raiz do
// seu projeto e adicionar as chaves correspondentes.
// Exemplo de arquivo .env:
// API_KEY=SUA_API_KEY
// AUTH_DOMAIN=SEU_AUTH_DOMAIN
// ... e assim por diante
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};


// Validação para garantir que as variáveis de ambiente foram configuradas.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
  console.error("Configuração do Firebase está incompleta. Verifique suas variáveis de ambiente.");
}


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços do Firebase para serem usados em todo o aplicativo
export const auth = getAuth(app);
export const db = getFirestore(app);
