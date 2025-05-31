// js/auth.js
console.log("auth.js: Script carregado.");
console.log("auth.js: Verificando objeto 'firebase' global no início:", typeof firebase);

var auth; // Declarar auth no escopo do arquivo
var db;   // Declarar db no escopo do arquivo

try {
    if (typeof firebase !== 'undefined') {
        console.log("auth.js: Objeto 'firebase' global existe.");
        if (firebase.auth) {
            console.log("auth.js: firebase.auth está disponível. Tentando obter instância de auth...");
            auth = firebase.auth(); // Atribuir à variável auth
            console.log("auth.js: Instância de Firebase auth obtida:", auth);
        } else {
            console.error("auth.js: ERRO - firebase.auth NÃO está disponível! O Firebase App foi inicializado corretamente em firebase-config.js e o SDK firebase-auth.js está carregado?");
        }

        if (firebase.firestore) {
            console.log("auth.js: firebase.firestore está disponível. Tentando obter instância de db...");
            db = firebase.firestore(); // Atribuir à variável db
            console.log("auth.js: Instância de Firestore (db) obtida:", db);
        } else {
            console.error("auth.js: ERRO - firebase.firestore NÃO está disponível! O SDK firebase-firestore.js está carregado e o Firebase App inicializado?");
        }
    } else {
        console.error("auth.js: ERRO CRÍTICO - Objeto 'firebase' global NÃO existe! SDKs do Firebase não foram carregados corretamente antes deste script.");
    }
} catch (e) {
    console.error("auth.js: ERRO CRÍTICO ao tentar obter instâncias de Firebase (auth/db):", e);
}

// --- Funções de Autenticação ---

function registrarUsuario(email, senha) {
    console.log("auth.js: registrarUsuario foi chamado com email:", email);
    console.log("auth.js: Verificando 'auth':", typeof auth, "e 'db':", typeof db);

    if (!auth || (typeof auth.createUserWithEmailAndPassword !== 'function')) {
        console.error("auth.js: registrarUsuario - Instância de 'auth' ou método createUserWithEmailAndPassword não está disponível!");
        if (typeof displayAuthFeedback === 'function') {
            displayAuthFeedback("Erro de configuração de autenticação. Tente mais tarde.", "error");
        }
        return;
    }
    if (!db || (typeof db.collection !== 'function')) { // Necessário para a whitelist
        console.error("auth.js: registrarUsuario - Instância de 'db' (Firestore) ou método collection não está disponível!");
        if (typeof displayAuthFeedback === 'function') {
            displayAuthFeedback("Erro de configuração do banco de dados para registro. Tente mais tarde.", "error");
        }
        return;
    }
    if (!email || !senha) {
        if (typeof displayAuthFeedback === 'function') displayAuthFeedback("E-mail e senha são obrigatórios.", "error");
        return;
    }
    const emailParaVerificar = email.trim().toLowerCase();
    console.log("auth.js: registrarUsuario - Verificando permissão para e-mail no Firestore:", emailParaVerificar);

    db.collection("allowedEmails").doc(emailParaVerificar).get()
        .then((doc) => {
            if (doc.exists) {
                console.log("auth.js: registrarUsuario - E-mail PERMITIDO:", emailParaVerificar, ". Registrando no Auth...");
                auth.createUserWithEmailAndPassword(emailParaVerificar, senha)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        console.log("auth.js: registrarUsuario - Usuário registrado no Auth:", user.email);
                        user.sendEmailVerification()
                            .then(() => {
                                console.log("auth.js: registrarUsuario - E-mail de verificação enviado para:", user.email);
                                if (typeof displayAuthFeedback === 'function') displayAuthFeedback("Registro bem-sucedido! Um e-mail de verificação foi enviado.", "success");
                            })
                            .catch((errorVerification) => {
                                console.error("auth.js: registrarUsuario - Erro ao enviar e-mail de verificação:", errorVerification);
                                if (typeof displayAuthFeedback === 'function') displayAuthFeedback("Registro OK, mas falha ao enviar e-mail de verificação.", "warning");
                            });
                    })
                    .catch((errorAuth) => {
                        console.error("auth.js: registrarUsuario - Erro no registro (Firebase Auth):", errorAuth);
                        let mensagemErro = "Ocorreu um erro ao registrar. Tente novamente.";
                        if (errorAuth.code === 'auth/email-already-in-use') mensagemErro = 'Este e-mail já foi registrado. Tente fazer login.';
                        else if (errorAuth.code === 'auth/weak-password') mensagemErro = 'A senha é muito fraca (mínimo 6 caracteres).';
                        if (typeof displayAuthFeedback === 'function') displayAuthFeedback(mensagemErro, "error");
                    });
            } else {
                console.log("auth.js: registrarUsuario - E-mail NÃO PERMITIDO:", emailParaVerificar);
                if (typeof displayAuthFeedback === 'function') displayAuthFeedback("Este e-mail não está autorizado para registro.", "error");
            }
        })
        .catch((errorFirestore) => {
            console.error("auth.js: registrarUsuario - Erro ao verificar e-mail no Firestore:", errorFirestore);
            if (typeof displayAuthFeedback === 'function') displayAuthFeedback("Erro ao verificar permissão de registro. Tente mais tarde.", "error");
        });
}

function logarUsuario(email, senha) {
    console.log("auth.js: logarUsuario foi chamado com email:", email);
    console.log("auth.js: Verificando instância de 'auth':", typeof auth);
    if (!auth || (typeof auth.signInWithEmailAndPassword !== 'function')) {
        console.error("auth.js: logarUsuario - Instância de 'auth' ou método signInWithEmailAndPassword não está disponível!");
        if (typeof displayAuthFeedback === 'function') {
            displayAuthFeedback("Erro de configuração de autenticação. Tente mais tarde.", "error");
        }
        return;
    }
    if (!email || !senha) {
        if (typeof displayAuthFeedback === 'function') displayAuthFeedback("E-mail e senha são obrigatórios.", "error");
        return;
    }
    auth.signInWithEmailAndPassword(email, senha)
        .then((userCredential) => {
            console.log("auth.js: logarUsuario - Usuário logado com sucesso:", userCredential.user.email);
            if (typeof displayAuthFeedback === 'function') {
                // displayAuthFeedback("Login bem-sucedido! Redirecionando...", "success"); // Opcional, onAuthStateChanged cuida do redirect
            }
        })
        .catch((error) => {
            console.error("auth.js: logarUsuario - Erro no login:", error);
            let mensagemErro = "E-mail ou senha incorretos. Tente novamente.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') mensagemErro = 'E-mail ou senha inválidos.';
            else if (error.code === 'auth/invalid-email') mensagemErro = 'O formato do e-mail é inválido.';
            if (typeof displayAuthFeedback === 'function') displayAuthFeedback(mensagemErro, "error");
        });
}

function deslogarUsuario() {
    console.log("auth.js: deslogarUsuario foi chamado. Verificando 'auth':", typeof auth);
    if (!auth || (typeof auth.signOut !== 'function')) {
        console.error("auth.js: deslogarUsuario - Instância de 'auth' ou método signOut não está disponível!");
        return;
    }
    auth.signOut().then(() => {
        console.log("auth.js: deslogarUsuario - Usuário deslogado com sucesso.");
    }).catch((error) => {
        console.error("auth.js: deslogarUsuario - Erro ao deslogar:", error);
        alert("Erro ao tentar sair.");
    });
}

function enviarEmailRecuperacaoSenha(email) {
    console.log("auth.js: enviarEmailRecuperacaoSenha foi chamado para:", email);
    console.log("auth.js: Verificando 'auth':", typeof auth);
     if (!auth || (typeof auth.sendPasswordResetEmail !== 'function')) {
        console.error("auth.js: enviarEmailRecuperacaoSenha - Instância de 'auth' ou método sendPasswordResetEmail não está disponível!");
         if (typeof displayAuthFeedback === 'function') displayAuthFeedback("Erro de configuração. Não é possível recuperar senha.", "error");
        return;
    }
    if (!email) {
        if (typeof displayAuthFeedback === 'function') displayAuthFeedback("Por favor, insira seu endereço de e-mail.", "warning");
        return;
    }
    auth.sendPasswordResetEmail(email)
        .then(() => {
            console.log("auth.js: enviarEmailRecuperacaoSenha - E-mail de recuperação enviado para:", email);
            if (typeof displayAuthFeedback === 'function') displayAuthFeedback("E-mail de recuperação enviado para " + email + ". Verifique sua caixa de entrada.", "success");
        })
        .catch((error) => {
            console.error("auth.js: enviarEmailRecuperacaoSenha - Erro ao enviar e-mail:", error);
            let mensagemErro = "Erro ao enviar e-mail de recuperação.";
            if (error.code === 'auth/user-not-found') mensagemErro = "Nenhum usuário encontrado com este e-mail.";
            else if (error.code === 'auth/invalid-email') mensagemErro = 'O formato do e-mail é inválido.';
            if (typeof displayAuthFeedback === 'function') displayAuthFeedback(mensagemErro, "error");
        });
}


// --- Observador de Estado de Autenticação ---
console.log("auth.js: Configurando onAuthStateChanged. Verificando 'auth':", typeof auth);
if (auth && typeof auth.onAuthStateChanged === 'function') {
    auth.onAuthStateChanged((user) => {
        const currentPage = window.location.pathname.split("/").pop();
        const userInfoEl = document.getElementById('userInfo'); // Para app.html
        const btnLogout = document.getElementById('btnLogout'); // Para app.html
        const emailVerificationStatusEl = document.getElementById('emailVerificationStatus'); // Para app.html
        const btnResendVerification = document.getElementById('btnResendVerification'); // Para app.html

        if (user) {
            console.log("auth.js: onAuthStateChanged - Usuário CONECTADO:", user.uid, user.email, "Verificado:", user.emailVerified);
            if (currentPage === 'index.html' || currentPage === '') {
                window.location.href = 'app.html';
            } else if (currentPage === 'app.html') {
                if (userInfoEl) userInfoEl.textContent = `Logado como: ${user.email}`;
                if (btnLogout) btnLogout.style.display = 'block';
                if (emailVerificationStatusEl && btnResendVerification) {
                    if (user.emailVerified) {
                        emailVerificationStatusEl.textContent = '(E-mail verificado)';
                        emailVerificationStatusEl.style.color = 'green';
                        btnResendVerification.style.display = 'none';
                    } else {
                        emailVerificationStatusEl.textContent = '(E-mail não verificado)';
                        emailVerificationStatusEl.style.color = 'orange';
                        btnResendVerification.style.display = 'inline-block';
                        btnResendVerification.onclick = () => {
                            user.sendEmailVerification()
                                .then(() => { alert("Novo e-mail de verificação enviado para " + user.email); })
                                .catch((e) => { console.error("Erro ao reenviar verificação:", e); alert("Erro ao reenviar e-mail de verificação."); });
                        };
                    }
                }
            }
        } else {
            console.log("auth.js: onAuthStateChanged - Usuário DESCONECTADO.");
            if (currentPage === 'app.html') {
                window.location.href = 'index.html';
            }
            // Limpeza da UI em app.html (caso a página não redirecione imediatamente)
            if (userInfoEl) userInfoEl.textContent = 'Bem-vindo!';
            if (btnLogout) btnLogout.style.display = 'none';
            if (emailVerificationStatusEl) emailVerificationStatusEl.textContent = '';
            if (btnResendVerification) btnResendVerification.style.display = 'none';
        }
    });
    console.log("auth.js: Listener onAuthStateChanged configurado.");
} else {
    console.error("auth.js: ERRO - Não foi possível configurar onAuthStateChanged porque 'auth' não é uma instância válida ou auth.onAuthStateChanged não é uma função.");
}