
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

console.log("firebase-config.js: Script carregado.");


try {
    console.log("firebase-config.js: Verificando objeto 'firebase' global:", typeof firebase);
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        console.log("firebase-config.js: Prestes a chamar firebase.initializeApp(). Config:", firebaseConfig);
        firebase.initializeApp(firebaseConfig); // Inicializa o app Firebase principal
        console.log("firebase-config.js: firebase.initializeApp() chamado com SUCESSO.");

        // Verifica se os serviços estão disponíveis após a inicialização
        if (firebase.auth) {
            console.log("firebase-config.js: firebase.auth() está disponível APÓS initializeApp.");
        } else {
            console.error("firebase-config.js: ERRO - firebase.auth() NÃO está disponível APÓS initializeApp.");
        }

        if (firebase.firestore) {
            // Inicializa o Firestore e atribui à variável db
            db = firebase.firestore();
            console.log("firebase-config.js: firebase.firestore() inicializado. Instância 'db':", typeof db);
            // Para tornar 'db' explicitamente global para outros scripts (se necessário, embora não seja a melhor prática)
            // window.db = db;
        } else {
            console.error("firebase-config.js: ERRO - firebase.firestore() NÃO está disponível.");
        }

    } else {
        console.error("firebase-config.js: ERRO - Objeto Firebase ou firebase.initializeApp não encontrado ANTES da chamada! Verifique se os SDKs do Firebase (firebase-app.js) estão carregados antes deste script no HTML.");
    }
} catch (e) {
    console.error("firebase-config.js: ERRO CRÍTICO ao tentar inicializar Firebase app:", e);
}