// js/auth.js

// --- Funções de Autenticação ---
const auth = firebase.auth();
/**
 * Registra um novo usuário com e-mail e senha.
 * @param {string} email - O e-mail do usuário.
 * @param {string} senha - A senha do usuário.
 */
function registrarUsuario(email, senha) {
    auth.createUserWithEmailAndPassword(email, senha)
        .then((userCredential) => {
            // Usuário registrado
            const user = userCredential.user;
            console.log("Usuário registrado:", user);

            // Enviar e-mail de verificação
            user.sendEmailVerification()
                .then(() => {
                    console.log("E-mail de verificação enviado para:", user.email);
                    if (typeof displayAuthFeedback === 'function') {
                        displayAuthFeedback("Registro bem-sucedido! Um e-mail de verificação foi enviado para " + user.email + ". Por favor, verifique sua caixa de entrada.", "success");
                    } else {
                        alert("Registro bem-sucedido! Um e-mail de verificação foi enviado. Por favor, verifique sua caixa de entrada.");
                    }
                    // O onAuthStateChanged cuidará do redirecionamento e da UI.
                    // Não vamos deslogar o usuário aqui, ele pode ser redirecionado para app.html
                    // e lá informamos sobre a necessidade de verificar o e-mail.
                })
                .catch((error) => {
                    console.error("Erro ao enviar e-mail de verificação:", error);
                    // Mesmo que o envio do e-mail de verificação falhe, o usuário foi criado.
                    // Informe o usuário sobre o sucesso do registro, mas talvez com um aviso sobre o e-mail.
                    if (typeof displayAuthFeedback === 'function') {
                        displayAuthFeedback("Registro bem-sucedido, mas houve um problema ao enviar o e-mail de verificação. Você pode tentar reenviá-lo mais tarde.", "warning");
                    }
                });
        })
        .catch((error) => {
            console.error("Erro no registro:", error.code, error.message);
            let mensagemErro = "Ocorreu um erro ao registrar. Tente novamente.";
            // ... (seu tratamento de erro existente) ...
            if (typeof displayAuthFeedback === 'function') {
                displayAuthFeedback(mensagemErro, "error");
            } else {
                alert(mensagemErro);
            }
        });
}

/**
 * Loga um usuário existente com e-mail e senha.
 * @param {string} email - O e-mail do usuário.
 * @param {string} senha - A senha do usuário.
 */
function logarUsuario(email, senha) {
    auth.signInWithEmailAndPassword(email, senha)
        .then((userCredential) => {
            // Usuário logado
            console.log("Usuário logado:", userCredential.user);
            // O onAuthStateChanged cuidará do redirecionamento e da UI.
            // Se precisar de feedback imediato na página de login:
            if (typeof displayAuthFeedback === 'function') {
                // displayAuthFeedback("Login bem-sucedido! Redirecionando...", "success"); // Feedback opcional
            }
            // Não é estritamente necessário redirecionar aqui, pois o onAuthStateChanged fará isso.
            // window.location.href = 'app.html';
        })
        .catch((error) => {
            console.error("Erro no login:", error.code, error.message);
            let mensagemErro = "E-mail ou senha incorretos. Tente novamente.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                mensagemErro = 'E-mail ou senha inválidos.';
            } else if (error.code === 'auth/invalid-email') {
                mensagemErro = 'O formato do e-mail é inválido.';
            }
            if (typeof displayAuthFeedback === 'function') {
                displayAuthFeedback(mensagemErro, "error");
            } else {
                alert(mensagemErro);
            }
        });
}

/**
 * Desloga o usuário atual.
 */
function deslogarUsuario() {
    auth.signOut().then(() => {
        console.log("Usuário deslogado.");
        // O onAuthStateChanged cuidará do redirecionamento.
        // window.location.href = 'index.html';
    }).catch((error) => {
        console.error("Erro ao deslogar:", error.message);
        alert("Erro ao tentar sair. Tente novamente.");
    });
}

/**
 * Envia um e-mail de redefinição de senha para o e-mail fornecido.
 * @param {string} email - O e-mail do usuário.
 */
function enviarEmailRecuperacaoSenha(email) {
    if (!email) {
        if (typeof displayAuthFeedback === 'function') {
            displayAuthFeedback("Por favor, insira seu endereço de e-mail.", "warning");
        } else {
            alert("Por favor, insira seu endereço de e-mail.");
        }
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            console.log("E-mail de recuperação de senha enviado para:", email);
            if (typeof displayAuthFeedback === 'function') {
                displayAuthFeedback("E-mail de recuperação de senha enviado para " + email + ". Verifique sua caixa de entrada (e spam).", "success");
            } else {
                alert("E-mail de recuperação de senha enviado. Verifique sua caixa de entrada (e spam).");
            }
        })
        .catch((error) => {
            console.error("Erro ao enviar e-mail de recuperação:", error);
            let mensagemErro = "Erro ao enviar e-mail de recuperação. Tente novamente.";
            if (error.code === 'auth/user-not-found') {
                mensagemErro = "Nenhum usuário encontrado com este e-mail.";
            } else if (error.code === 'auth/invalid-email') {
                mensagemErro = "O formato do e-mail é inválido.";
            }

            if (typeof displayAuthFeedback === 'function') {
                displayAuthFeedback(mensagemErro, "error");
            } else {
                alert(mensagemErro);
            }
        });
}


// --- Observador de Estado de Autenticação ---
// Este é o listener principal que reage às mudanças de estado de login.
auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname.split("/").pop(); // Obtém o nome do arquivo atual (ex: index.html)

    if (user) {
        // Usuário está logado
        console.log("Auth state: Usuário conectado:", user.uid, user.email);

        // Se estiver na página de login (index.html), redireciona para a aplicação principal (app.html)
        if (currentPage === 'index.html' || currentPage === '') {
            window.location.href = 'app.html';
        } else if (currentPage === 'app.html') {
            // Atualiza UI em app.html se já estiver nela
            const userInfoEl = document.getElementById('userInfo');
            if (userInfoEl) {
                userInfoEl.textContent = `Logado como: ${user.email}`;
            }
            const btnLogout = document.getElementById('btnLogout');
            if (btnLogout) {
                btnLogout.style.display = 'block'; // Ou 'inline-block', etc.
            }
            // Aqui você pode também chamar a função para carregar os dados do usuário do localStorage
            // ou, futuramente, do Firestore.
            // Ex: if (typeof carregarDados === 'function') carregarDados();
        }

    } else {
        // Usuário não está logado
        console.log("Auth state: Nenhum usuário conectado.");

        // Se estiver tentando acessar app.html sem login, redireciona para index.html
        if (currentPage === 'app.html') {
            window.location.href = 'index.html';
        } else if (currentPage === 'index.html' || currentPage === '') {
            // Garante que a UI de login/registro está correta em index.html
            // (os formulários já devem estar visíveis por padrão)
        }
        // Em app.html, se houver, limpa informações do usuário e esconde botão de logout
        // (embora o redirecionamento acima deva prevenir isso)
        if (currentPage === 'app.html') { // Adicional, caso o redirecionamento demore ou falhe
            const userInfoEl = document.getElementById('userInfo');
            if (userInfoEl) {
                userInfoEl.textContent = 'Bem-vindo!';
            }
            const btnLogout = document.getElementById('btnLogout');
            if (btnLogout) {
                btnLogout.style.display = 'none';
            }
        }
    }
});