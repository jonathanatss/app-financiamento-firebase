// js/ui.js (Exemplo muito básico, pode ser expandido)

// Esta função poderia ser chamada de auth.js quando o usuário loga
function exibirInfoUsuario(email) {
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
        userInfoEl.textContent = `Logado como: ${email}`;
    }
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.style.display = 'block'; // Ou 'inline-block', etc.
    }
}

// Esta função poderia ser chamada de auth.js quando o usuário desloga
function limparInfoUsuario() {
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
        userInfoEl.textContent = 'Bem-vindo!';
    }
     const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.style.display = 'none';
    }
}

// Você pode adicionar mais funções aqui para controlar a visibilidade
// dos formulários de login/registro em index.html se não quiser
// o script inline que coloquei lá.