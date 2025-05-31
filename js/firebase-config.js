
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAagGeX8GGNqwjL-mqZHlSz3UeQ0FHX2PI",
  authDomain: "app-financiamento-58173.firebaseapp.com",
  projectId: "app-financiamento-58173",
  storageBucket: "app-financiamento-58173.firebasestorage.app",
  messagingSenderId: "23491129425",
  appId: "1:23491129425:web:85c5316097f68119234870",
  measurementId: "G-E85G2PQJ6J"
};

// Logs para depuração
console.log("firebase-config.js: Script carregado.");
console.log("firebase-config.js: Verificando objeto 'firebase' global antes de init:", typeof firebase);

try {
    // Verifica se o objeto 'firebase' e a função 'initializeApp' existem
    if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
        console.log("firebase-config.js: Objeto 'firebaseConfig':", firebaseConfig); // Mostra a config para verificação (sem aspas em volta das chaves)
        console.log("firebase-config.js: Prestes a chamar firebase.initializeApp()...");

        // 2. Inicializa o Firebase
        firebase.initializeApp(firebaseConfig);

        console.log("firebase-config.js: firebase.initializeApp() chamado com SUCESSO.");

        // Verifica a disponibilidade dos serviços após a inicialização
        if (firebase.auth) {
            console.log("firebase-config.js: firebase.auth() está disponível APÓS initializeApp.");
        } else {
            console.error("firebase-config.js: ERRO - firebase.auth() NÃO está disponível APÓS initializeApp. Verifique se o SDK firebase-auth.js está carregado no HTML ANTES deste script.");
        }

        if (firebase.firestore) {
            console.log("firebase-config.js: firebase.firestore() está disponível APÓS initializeApp.");
            // Nota: A instância 'db' para o Firestore será criada em auth.js
            // ou em qualquer outro script que precise dela, chamando firebase.firestore()
        } else {
            console.error("firebase-config.js: ERRO - firebase.firestore() NÃO está disponível APÓS initializeApp. Verifique se o SDK firebase-firestore.js está carregado no HTML ANTES deste script.");
        }

    } else {
        console.error("firebase-config.js: ERRO CRÍTICO - Objeto 'firebase' global ou a função 'firebase.initializeApp' não foi encontrada! Verifique se o SDK principal firebase-app.js está carregado corretamente no HTML ANTES deste script.");
    }
} catch (e) {
    console.error("firebase-config.js: ERRO CRÍTICO ao tentar inicializar o Firebase app:", e);
    console.error("firebase-config.js: Verifique se o objeto 'firebaseConfig' acima está preenchido corretamente com suas credenciais do Firebase e se não há erros de digitação.");
}