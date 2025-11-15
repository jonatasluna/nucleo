
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// ATENÇÃO: Substitua pelos dados do seu projeto Firebase
// Você pode encontrar em: Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyDV4i7Pg18EfxEIwbWEwhP_iWBYo9DTBE0",
  authDomain: "nucleo-64c64.firebaseapp.com",
  projectId: "nucleo-64c64",
  storageBucket: "nucleo-64c64.firebasestorage.app",
  messagingSenderId: "305183564346",
  appId: "1:305183564346:web:99d13ee79eb77ef0f94b03"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Só inicializa o cliente se a configuração não for o placeholder
if (firebaseConfig.apiKey !== "AIzaSyDV4i7Pg18EfxEIwbWEwhP_iWBYo9DTBE0" && firebaseConfig.apiKey) {
  // Inicializa o Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
    // Exibe um aviso proeminente no console para o desenvolvedor
    console.warn(`****************************************************************\nATENÇÃO: Credenciais do Firebase não configuradas.\nEdite o arquivo 'firebaseClient.ts' com os dados do seu projeto.\n****************************************************************`);
}


export { app, auth, db };
