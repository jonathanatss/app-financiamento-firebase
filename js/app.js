// js/app.js
let dados = {
    pagantes: [],
    pagamentos: [],
    metasDePagamento: [],
    configuracoes: { valorImovel: 0, valorFinanciado: 0, inccBase: 100 },
    historicoINCC: []
};

// --- FUNÇÕES HELPER ---
function updateFormattedInputDisplay(inputId, displaySpanId, prefixText = "Equivalente a: R$ ") {
    const inputElement = document.getElementById(inputId);
    const displayElement = document.getElementById(displaySpanId);
    
    if (!inputElement || !displayElement) {
        return;
    }
    const rawValue = parseFloat(inputElement.value);
    if (inputElement.value.trim() === '' || isNaN(rawValue)) {
        displayElement.textContent = '';
    } else {
        displayElement.textContent = prefixText + rawValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

// NOVA FUNÇÃO HELPER: Formatar Moeda
function formatarMoeda(valor) {
    if (typeof valor !== 'number' || isNaN(valor)) {
        valor = 0;
    }
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// --- DADOS E PERSISTÊNCIA ---
function carregarDados() {
    try {
        const dadosSalvos = localStorage.getItem('financiamentoData');
        if (dadosSalvos) {
            const dadosParseados = JSON.parse(dadosSalvos);
            // Garante que a estrutura base exista antes de espalhar os dados parseados
            const estruturaBase = {
                pagantes: [], pagamentos: [], metasDePagamento: [], 
                configuracoes: { valorImovel: 0, valorFinanciado: 0, inccBase: 100 }, 
                historicoINCC: []
            };
            dados = { ...estruturaBase, ...dadosParseados };

            // Garante que as arrays principais existam
            if (!Array.isArray(dados.pagantes)) dados.pagantes = [];
            if (!Array.isArray(dados.pagamentos)) dados.pagamentos = [];
            if (!Array.isArray(dados.metasDePagamento)) dados.metasDePagamento = [];
            if (!Array.isArray(dados.historicoINCC)) dados.historicoINCC = [];
        }
    } catch (error) {
        console.error("Erro ao carregar dados do localStorage:", error);
        mostrarAlerta("Erro ao carregar dados. Alguns dados podem ter sido resetados.", "error");
        // Reset para a estrutura base em caso de erro grave
        dados = { pagantes: [], pagamentos: [], metasDePagamento: [], configuracoes: { valorImovel: 0, valorFinanciado: 0, inccBase: 100 }, historicoINCC: [] };
    }
}

function salvarDados() {
    localStorage.setItem('financiamentoData', JSON.stringify(dados));
}

// --- NAVEGAÇÃO E UI GERAL ---
function showSection(sectionId, clickedButtonElement) { // Adicionado clickedButtonElement
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) sectionToShow.classList.add('active');
    
    if (clickedButtonElement) { // Marca o botão clicado como ativo
        clickedButtonElement.classList.add('active');
    } else { // Fallback para encontrar o botão se não foi passado (raro, mas seguro)
        const activeButton = document.querySelector(`.nav-btn[onclick*="'${sectionId}'"]`);
        if(activeButton) activeButton.classList.add('active');
    }
    
    if (sectionId === 'dashboard') {
        // Ao mostrar o dashboard, popula os seletores (caso dados tenham mudado)
        // e atualiza a visão do dashboard com os filtros atuais.
        popularSelectAnoDashboardFiltro(); // Garante que os anos estão atualizados
        const mesSelect = document.getElementById('selectMesDashboardFiltro');
        const anoSelect = document.getElementById('selectAnoDashboardFiltro');
        const mes = mesSelect ? mesSelect.value : "";
        const ano = anoSelect ? anoSelect.value : "";
        atualizarDashboard(mes, ano);
    } else {
        // Para outras seções, a atualizarInterfaceCompleta cuidará de chamar atualizarDashboard
        // com os filtros padrão (ou os últimos aplicados se você implementar persistência de filtro)
        // Se você só quer que o dashboard padrão (sem filtro ou com filtro "Todos") seja
        // mostrado quando outras partes da UI são atualizadas, isso já está coberto.
    }
     if (typeof atualizarInterfaceCompleta === 'function' && sectionId !== 'dashboard') {
        // A atualizarInterfaceCompleta pode chamar atualizarDashboard globalmente.
        // Se atualizarDashboard for modificada para aceitar filtros, ela precisa de valores padrão.
        // Por hora, a lógica de atualização do dashboard está concentrada no if (sectionId === 'dashboard')
        // e no botão "Aplicar".
    }
}

function openModal(modalId) {
    // Seu código openModal existente...
    // (O código que você forneceu para openModal parece bom)
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const idPagamentoEditandoField = document.getElementById('idPagamentoEditando');
    const idPaganteEditandoField = document.getElementById('idPaganteEditando');
    const idMetaEditandoField = document.getElementById('idMeta');

    let title = '', buttonText = '';

    switch(modalId) {
        case 'modalPagamento':
            title = idPagamentoEditandoField.value ? 'Editar Pagamento' : 'Adicionar Pagamento';
            buttonText = idPagamentoEditandoField.value ? '<i class="fas fa-save"></i> Salvar Alterações' : '<i class="fas fa-plus"></i> Adicionar';
            document.getElementById('modalPagamentoTitle').textContent = title;
            document.getElementById('btnSubmitPagamento').innerHTML = buttonText;
            popularSelectMetas();
            break;
        case 'modalPagante':
            title = idPaganteEditandoField.value ? 'Editar Pagante' : 'Adicionar Pagante';
            buttonText = idPaganteEditandoField.value ? '<i class="fas fa-save"></i> Salvar Alterações' : '<i class="fas fa-plus"></i> Adicionar';
            document.getElementById('modalPaganteTitle').textContent = title;
            document.getElementById('btnSalvarPagante').innerHTML = buttonText;
            break;
        case 'modalMeta':
            title = idMetaEditandoField.value ? 'Editar Meta de Pagamento' : 'Adicionar Nova Meta';
            buttonText = idMetaEditandoField.value ? '<i class="fas fa-save"></i> Salvar Alterações' : '<i class="fas fa-plus"></i> Adicionar Meta';
            document.getElementById('modalMetaTitle').textContent = title;
            document.getElementById('btnSalvarMeta').innerHTML = buttonText;
            break;
    }
    modal.style.display = 'block';
    modal.classList.add('active-modal-display');
}

function closeModal(modalId) {
    // Seu código closeModal existente...
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active-modal-display');
    }
    limparFormularios(modalId);
}

function limparFormularios(modalId) { 
    // Seu código limparFormularios existente...
    const modal = document.getElementById(modalId);
    if (modal) {
        const form = modal.querySelector('form');
        if (form) form.reset();
        const formattedSpans = modal.querySelectorAll('.formatted-input-display');
        formattedSpans.forEach(span => span.textContent = '');
        if (modalId === 'modalPagamento') {
            document.getElementById('idPagamentoEditando').value = '';
            document.getElementById('camposContribuicaoPagantes').innerHTML = '';
            document.getElementById('blocoContribuicoesPagantes').style.display = 'none';
            validarSomaContribuicoes(); 
        } else if (modalId === 'modalPagante') {
            document.getElementById('idPaganteEditando').value = '';
        } else if (modalId === 'modalMeta') {
            document.getElementById('idMeta').value = '';
            document.getElementById('metaPrincipalDashboard').checked = false;
        }
    }
}


// --- PAGANTES ---
// Suas funções salvarPagante, abrirModalEdicaoPaganteComDados, removerPagante, 
// atualizarListaPagantes, atualizarNomesPagantesNosRateiosEDisplay existentes...
// (O código que você forneceu parece bom)
function salvarPagante(event) {
    event.preventDefault();
    const id = document.getElementById('idPaganteEditando').value;
    const nome = document.getElementById('nomePagante').value.trim();
    const apelido = document.getElementById('apelidoPagante').value.trim() || nome;

    if (!nome) return mostrarAlerta('Nome do pagante é obrigatório.', 'warning');

    let msg = '';
    let nomeOuApelidoMudou = false;
    
    if (id) { 
        const pagante = dados.pagantes.find(p => p.id === parseInt(id));
        if (pagante) {
            if (pagante.nome !== nome || pagante.apelido !== apelido) {
                nomeOuApelidoMudou = true;
                if (dados.pagantes.some(p => p.id !== parseInt(id) && p.apelido.toLowerCase() === apelido.toLowerCase() && apelido !== "")) {
                    return mostrarAlerta('Este apelido já está em uso por outro pagante.', 'warning');
                }
            }
            pagante.nome = nome;
            pagante.apelido = apelido;
            if (nomeOuApelidoMudou) {
                atualizarNomesPagantesNosRateiosEDisplay(parseInt(id), apelido);
            }
            msg = 'Pagante atualizado!';
        }
    } else { 
        if (dados.pagantes.some(p => p.apelido.toLowerCase() === apelido.toLowerCase() && apelido !== "")) {
            return mostrarAlerta('Já existe um pagante com este apelido.', 'warning');
        }
        dados.pagantes.push({ id: Date.now(), nome, apelido });
        msg = 'Pagante adicionado!';
    }
    salvarDados();
    closeModal('modalPagante');
    atualizarListaPagantes();
    if(nomeOuApelidoMudou) atualizarListaPagamentos();
    mostrarAlerta(msg, 'success');
}

function abrirModalEdicaoPaganteComDados(paganteId) {
    const pagante = dados.pagantes.find(p => p.id === paganteId);
    if (pagante) {
        document.getElementById('idPaganteEditando').value = pagante.id;
        document.getElementById('nomePagante').value = pagante.nome;
        document.getElementById('apelidoPagante').value = pagante.apelido;
    }
    openModal('modalPagante');
}

function removerPagante(id) {
    const pagante = dados.pagantes.find(p => p.id === id);
    if (!pagante) return;
    let msgConfirm = `Remover "${pagante.apelido}"? Suas contribuições passadas serão mantidas no histórico dos pagamentos.`;
    if (confirm(msgConfirm)) {
        dados.pagantes = dados.pagantes.filter(p => p.id !== id);
        if (document.getElementById('modalPagamento').classList.contains('active-modal-display')) {
            gerenciarCamposContribuicao(document.getElementById('idPagamentoEditando').value ? dados.pagamentos.find(p => p.id === parseInt(document.getElementById('idPagamentoEditando').value)) : null);
        }
        salvarDados();
        atualizarInterfaceCompleta();
        mostrarAlerta(`Pagante "${pagante.apelido}" removido.`, 'success');
    }
}

function atualizarListaPagantes() {
    const lista = document.getElementById('pagantesList');
    lista.innerHTML = dados.pagantes.length === 0 ? '<p style="text-align: center; color: #666;">Nenhum pagante cadastrado.</p>' :
        dados.pagantes.map(p => `
            <div class="item">
                <div class="item-info"><h4>${p.apelido}</h4><p><strong>Nome:</strong> ${p.nome}</p></div>
                <div class="item-actions">
                    <button class="btn btn-warning" onclick="abrirModalEdicaoPaganteComDados(${p.id})"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn btn-danger" onclick="removerPagante(${p.id})"><i class="fas fa-trash"></i> Remover</button>
                </div>
            </div>`).join('');
}

function atualizarNomesPagantesNosRateiosEDisplay(paganteId, novoApelido) {
    dados.pagamentos.forEach(pgto => {
        pgto.rateio?.forEach(r => { if (r.pagante_id === paganteId) r.nome = novoApelido; });
    });
    if (document.getElementById('modalPagamento').classList.contains('active-modal-display')) {
        const labelPagante = document.querySelector(`#camposContribuicaoPagantes label[for="contrib-${paganteId}"]`);
        if (labelPagante) labelPagante.textContent = `${novoApelido}:`;
    }
}


// --- PAGAMENTOS ---
// Suas funções abrirModalEdicaoPagamento, gerenciarCamposContribuicao, validarSomaContribuicoes,
// salvarPagamento, mesclarRateio, reavaliarStatusPagamento, marcarComoPago, removerPagamento,
// atualizarListaPagamentos existentes...
// (O código que você forneceu parece bom)
function abrirModalEdicaoPagamento(pagamentoId) { 
    const form = document.getElementById('formPagamento');
    form.reset(); 
    document.getElementById('idPagamentoEditando').value = pagamentoId || '';
    
    const formattedDisplaySpan = document.getElementById('formattedValorPagamentoDisplay');
    if (formattedDisplaySpan) formattedDisplaySpan.textContent = '';
    document.getElementById('camposContribuicaoPagantes').innerHTML = '';

    if (pagamentoId) {
        const pagamento = dados.pagamentos.find(p => p.id === pagamentoId);
        if (pagamento) {
            document.getElementById('tipoPagamento').value = pagamento.tipo;
            document.getElementById('descricaoPagamento').value = pagamento.descricao;
            document.getElementById('valorPagamento').value = pagamento.valor;
            document.getElementById('dataPagamento').value = pagamento.dataVencimento;
            document.getElementById('vincularMetaPagamento').value = pagamento.idMetaPagamento || "";
            updateFormattedInputDisplay('valorPagamento', 'formattedValorPagamentoDisplay'); 
        } else {
            mostrarAlerta('Pagamento não encontrado para edição!', 'error');
            document.getElementById('idPagamentoEditando').value = '';
        }
    }
    updateTipoPagamento(); 
    openModal('modalPagamento'); 
    gerenciarCamposContribuicao(pagamentoId ? dados.pagamentos.find(p=>p.id === parseInt(pagamentoId)) : null);
}

function gerenciarCamposContribuicao(pagamentoExistente = null) { 
    const containerCampos = document.getElementById('camposContribuicaoPagantes');
    const blocoContribuicoes = document.getElementById('blocoContribuicoesPagantes');
    const valorTotalInput = document.getElementById('valorPagamento');
    containerCampos.innerHTML = ''; 

    if (dados.pagantes.length === 0) {
        blocoContribuicoes.style.display = 'none';
        validarSomaContribuicoes(); 
        return;
    }
    if (dados.pagantes.length === 1) {
        blocoContribuicoes.style.display = 'none';
        validarSomaContribuicoes();
        return;
    }

    blocoContribuicoes.style.display = 'block';
    const valorTotalAtual = parseFloat(valorTotalInput.value) || 0;

    dados.pagantes.forEach((pagante, index) => {
        let valorContribuido = 0;
        if (pagamentoExistente && pagamentoExistente.rateio) {
            const rateioPagante = pagamentoExistente.rateio.find(r => r.pagante_id === pagante.id);
            if (rateioPagante) valorContribuido = rateioPagante.valor;
        }
        const div = document.createElement('div');
        div.className = 'form-group-contrib';
        const inputId = `contrib-${pagante.id}`;
        const displaySpanId = `formatted-${inputId}`;

        div.innerHTML = `
            <label for="${inputId}">${pagante.apelido}:</label>
            <input type="number" id="${inputId}" class="input-contribuicao"
                   data-pagante-id="${pagante.id}" value="${valorContribuido.toFixed(2)}"
                   step="0.01" min="0" oninput="validarSomaContribuicoes(); updateFormattedInputDisplay('${inputId}', '${displaySpanId}');">
            <span id="${displaySpanId}" class="formatted-input-display" style="margin-left: 40%;"></span>`;
        containerCampos.appendChild(div);
        updateFormattedInputDisplay(inputId, displaySpanId); 
    });
    validarSomaContribuicoes();
}

function validarSomaContribuicoes() {
    const valorTotalPagamento = parseFloat(document.getElementById('valorPagamento').value) || 0;
    let somaContrib = 0;
    const inputsContribuicao = document.querySelectorAll('.input-contribuicao');
    
    inputsContribuicao.forEach(input => {
        somaContrib += parseFloat(input.value) || 0;
    });

    const diferenca = valorTotalPagamento - somaContrib;
    document.getElementById('valorTotalPagamentoDisplay').textContent = valorTotalPagamento.toLocaleString('pt-BR', {minimumFractionDigits:2});
    document.getElementById('somaContribuicoesDisplay').textContent = somaContrib.toLocaleString('pt-BR', {minimumFractionDigits:2});
    const diferencaDisplay = document.getElementById('diferencaContribuicoesDisplay');
    diferencaDisplay.textContent = diferenca.toLocaleString('pt-BR', {minimumFractionDigits:2});
    diferencaDisplay.style.color = Math.abs(diferenca) < 0.001 ? 'green' : 'red';

    const btnSubmitPagamento = document.getElementById('btnSubmitPagamento');
    if (btnSubmitPagamento) {
        if (dados.pagantes.length <= 1 || Math.abs(diferenca) < 0.001 ) {
            btnSubmitPagamento.disabled = false;
            btnSubmitPagamento.style.opacity = '1';
        } else {
            btnSubmitPagamento.disabled = true;
            btnSubmitPagamento.style.opacity = '0.5';
        }
    }
}

function salvarPagamento(event) {
    event.preventDefault();
    const id = document.getElementById('idPagamentoEditando').value;
    const tipo = document.getElementById('tipoPagamento').value;
    const descricao = document.getElementById('descricaoPagamento').value.trim();
    const valor = parseFloat(document.getElementById('valorPagamento').value);
    const dataVencimento = document.getElementById('dataPagamento').value;
    const idMetaPagamento = document.getElementById('vincularMetaPagamento').value || null;

    if (!tipo || !descricao || isNaN(valor) || valor <= 0 || !dataVencimento) {
        return mostrarAlerta('Preencha todos os campos obrigatórios do pagamento.', 'warning');
    }

    const novoRateio = [];
    if (dados.pagantes.length > 1) {
        let somaContribParaValidacao = 0;
        document.querySelectorAll('.input-contribuicao').forEach(input => {
            const pagante_id = parseInt(input.dataset.paganteId);
            const valorContribuido = parseFloat(input.value) || 0;
            somaContribParaValidacao += valorContribuido;
            const paganteInfo = dados.pagantes.find(p=>p.id === pagante_id);
            if (paganteInfo) { 
                novoRateio.push({ pagante_id, nome: paganteInfo.apelido, valor: valorContribuido, pago: false });
            }
        });
        if (Math.abs(valor - somaContribParaValidacao) > 0.001) {
            return mostrarAlerta('A soma das contribuições (R$ ' + somaContribParaValidacao.toFixed(2) + ') não bate com o Valor Total (R$ ' + valor.toFixed(2) + ').', 'warning');
        }
    } else if (dados.pagantes.length === 1) {
        const paganteUnico = dados.pagantes[0];
        novoRateio.push({ pagante_id: paganteUnico.id, nome: paganteUnico.apelido, valor: valor, pago: false });
    }

    let msg = '';
    let metaAntigaId = null;
    let pagamentoEditadoOuNovo = null;

    if (id) { 
        const index = dados.pagamentos.findIndex(p => p.id === parseInt(id));
        if (index > -1) {
            pagamentoEditadoOuNovo = dados.pagamentos[index];
            metaAntigaId = pagamentoEditadoOuNovo.idMetaPagamento;
            
            pagamentoEditadoOuNovo.tipo = tipo;
            pagamentoEditadoOuNovo.descricao = descricao;
            pagamentoEditadoOuNovo.valor = valor;
            pagamentoEditadoOuNovo.dataVencimento = dataVencimento;
            pagamentoEditadoOuNovo.idMetaPagamento = idMetaPagamento ? parseInt(idMetaPagamento) : null;
            pagamentoEditadoOuNovo.rateio = mesclarRateio(pagamentoEditadoOuNovo.rateio, novoRateio);
            reavaliarStatusPagamento(pagamentoEditadoOuNovo);
            msg = 'Pagamento atualizado!';
        }
    } else { 
        const novoPagamentoObj = {
            id: Date.now(), tipo, descricao, valor, dataVencimento, status: 'pendente',
            idMetaPagamento: idMetaPagamento ? parseInt(idMetaPagamento) : null,
            rateio: novoRateio
        };
        dados.pagamentos.push(novoPagamentoObj);
        pagamentoEditadoOuNovo = novoPagamentoObj;
        msg = 'Pagamento adicionado!';
    }

    if (metaAntigaId && metaAntigaId !== (pagamentoEditadoOuNovo.idMetaPagamento ? parseInt(pagamentoEditadoOuNovo.idMetaPagamento) : null)) {
        calcularSaldoDeMeta(metaAntigaId);
    }
    if (pagamentoEditadoOuNovo.idMetaPagamento) {
        calcularSaldoDeMeta(pagamentoEditadoOuNovo.idMetaPagamento);
    }
    
    salvarDados();
    closeModal('modalPagamento');
    atualizarInterfaceCompleta();
    mostrarAlerta(msg, 'success');
}

function mesclarRateio(rateioAntigo, novoRateioCalculado) {
    if (!rateioAntigo || rateioAntigo.length === 0) return novoRateioCalculado;
    return novoRateioCalculado.map(novoItem => {
        const itemAntigoCorrespondente = rateioAntigo.find(antigo => antigo.pagante_id === novoItem.pagante_id);
        const valorMudou = itemAntigoCorrespondente ? Math.abs(itemAntigoCorrespondente.valor - novoItem.valor) > 0.001 : true;
        return { ...novoItem, pago: itemAntigoCorrespondente && !valorMudou ? itemAntigoCorrespondente.pago : false };
    });
}

function reavaliarStatusPagamento(pagamento) {
    if (!pagamento.rateio || pagamento.rateio.length === 0) {
        pagamento.status = pagamento.valor > 0 ? 'pendente' : 'pago'; 
        return;
    }
    const todosItensRateioPagosOuZerados = pagamento.rateio.every(r => r.pago || r.valor === 0);
    const algumItemRateioPagoComValor = pagamento.rateio.some(r => r.pago && r.valor > 0);

    if (todosItensRateioPagosOuZerados) pagamento.status = 'pago';
    else if (algumItemRateioPagoComValor) pagamento.status = 'parcial';
    else pagamento.status = 'pendente';
}

function marcarComoPago(pagamentoId, paganteId = null) {
    const pagamento = dados.pagamentos.find(p => p.id === pagamentoId);
    if (!pagamento) return;

    if (paganteId) {
        const rateioItem = pagamento.rateio?.find(r => r.pagante_id === paganteId);
        if (rateioItem && rateioItem.valor > 0) rateioItem.pago = !rateioItem.pago;
    } else { 
        const marcarPagoGlobal = !pagamento.rateio?.every(r => r.pago || r.valor === 0);
        pagamento.rateio?.forEach(r => { if (r.valor > 0) r.pago = marcarPagoGlobal; });
    }
    reavaliarStatusPagamento(pagamento);
    if (pagamento.idMetaPagamento) calcularSaldoDeMeta(pagamento.idMetaPagamento);
    salvarDados();
    atualizarListaPagamentos();
    // MODIFICADO: Chamar atualizarInterfaceCompleta que já chama o dashboard com filtro
    atualizarInterfaceCompleta(); 
}

function removerPagamento(id) {
    const pagamento = dados.pagamentos.find(p => p.id === id);
    if (!pagamento) return;
    if (confirm(`Remover pagamento "${pagamento.descricao}"?`)) {
        const idMetaVinculada = pagamento.idMetaPagamento;
        dados.pagamentos = dados.pagamentos.filter(p => p.id !== id);
        if (idMetaVinculada) calcularSaldoDeMeta(idMetaVinculada);
        salvarDados();
        atualizarInterfaceCompleta();
        mostrarAlerta('Pagamento removido.', 'success');
    }
}

function atualizarListaPagamentos() {
    const lista = document.getElementById('pagamentosList');
    if (!lista) return; 

    lista.innerHTML = dados.pagamentos.length === 0 ? '<p style="text-align:center;color:#666;">Nenhum pagamento cadastrado.</p>' :
        [...dados.pagamentos].sort((a,b) => new Date(b.dataVencimento + "T00:00:00") - new Date(a.dataVencimento + "T00:00:00"))
        .map(p => {
            const dataVenc = new Date(p.dataVencimento + "T00:00:00");
            const hoje = new Date(); hoje.setHours(0,0,0,0);
            let sClass = p.status;
            let sText = p.status.charAt(0).toUpperCase() + p.status.slice(1);
            if (p.status === 'pendente' && dataVenc < hoje) { sClass = 'atrasado'; sText = 'Atrasado'; }
            if (p.status === 'parcial' && dataVenc < hoje) sText += ' (Atrasado)';

            return `
            <div class="item">
                <div class="item-info">
                    <h4>${p.descricao}</h4>
                    <p><strong>Tipo:</strong> ${getTipoNome(p.tipo)}</p>
                    <p><strong>Valor Total:</strong> ${formatarMoeda(p.valor)}</p>
                    <p><strong>Vencimento:</strong> ${dataVenc.toLocaleDateString('pt-BR')}</p>
                    <span class="status ${sClass}">${sText}</span>
                    ${(p.rateio && p.rateio.length > 0) ? `
                        <div data-rateio-container="true"><strong>Rateio (Contribuições):</strong>
                        ${p.rateio.map(r => {
                            const percentualContribuicao = (p.valor > 0 && r.valor > 0) ? (r.valor / p.valor) * 100 : 0;
                            return `
                            <div class="rateio-detalhe-item" style="background:${r.pago ? '#e6fffa':'#fff5f5'};">
                                <span>${r.nome}: ${formatarMoeda(r.valor)} 
                                    <span style="color: #007bff; font-weight: bold;">(${percentualContribuicao.toFixed(1)}%)</span>
                                </span>
                                ${r.valor > 0 ? `<button class="btn" data-rateio-btn="true" style="background-color:${r.pago?'#28a745':'#6c757d'};color:white;" onclick="marcarComoPago(${p.id},${r.pagante_id})">${r.pago?'<i class="fas fa-check-circle"></i> Pago':'Marcar'}</button>` : ''}
                            </div>`;
                        }).join('')}
                        </div>` 
                    : (p.valor > 0 && dados.pagantes.length > 0 ? '<p style="font-size:0.9em; color:#666; margin-top:5px;">Rateio não definido para este pagamento.</p>' : '')}
                    ${p.idMetaPagamento ? `<p data-meta-vinculada="true"><i class="fas fa-bullseye"></i> Vinculado à Meta: <strong>${dados.metasDePagamento.find(m=>m.id===p.idMetaPagamento)?.nome||'N/A'}</strong></p>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-warning" onclick="abrirModalEdicaoPagamento(${p.id})"><i class="fas fa-edit"></i> Editar</button>
                        ${(p.rateio && p.rateio.length > 0 && p.rateio.some(r => r.valor > 0)) || (p.valor > 0 && (!p.rateio || p.rateio.length === 0)) ? `
                        <button class="btn ${p.status==='pago'?'btn-secondary':'btn-success'}" onclick="marcarComoPago(${p.id})">
                            ${p.status==='pago'?'<i class="fas fa-undo"></i> Desmarcar ':'<i class="fas fa-check-double"></i> Pagar '} ${p.rateio && p.rateio.length > 0 ? 'Todos':'Pagamento'}
                        </button>` : ''}
                    <button class="btn btn-danger" onclick="removerPagamento(${p.id})"><i class="fas fa-trash"></i> Remover</button>
                </div>
            </div>`;
        }).join('');
}


// --- METAS ---
// Suas funções openModalMeta, handleMetaPrincipalCheckbox, salvarMeta, removerMeta,
// calcularSaldoDeMeta, calcularTodosSaldosDeMetas, atualizarListaMetas, popularSelectMetas existentes...
// (O código que você forneceu parece bom)
function openModalMeta(metaId = null) { 
    const form = document.getElementById('formMeta'); form.reset();
    document.getElementById('idMeta').value = metaId || '';
    
    const formattedDisplaySpan = document.getElementById('formattedValorTotalMetaDisplay');
    if(formattedDisplaySpan) formattedDisplaySpan.textContent = ''; 

    if (metaId) {
        const meta = dados.metasDePagamento.find(m => m.id === metaId);
        if (meta) {
            document.getElementById('nomeMeta').value = meta.nome;
            document.getElementById('valorTotalMeta').value = meta.valorTotal;
            document.getElementById('metaPrincipalDashboard').checked = meta.principalNoDashboard || false;
            updateFormattedInputDisplay('valorTotalMeta', 'formattedValorTotalMetaDisplay'); 
        }
    } else {
        document.getElementById('metaPrincipalDashboard').checked = false;
    }
    openModal('modalMeta');
}

function handleMetaPrincipalCheckbox(checkbox) {
    // A lógica é tratada em salvarMeta
}

function salvarMeta(event) {
    event.preventDefault();
    const id = document.getElementById('idMeta').value;
    const nome = document.getElementById('nomeMeta').value.trim();
    const valorTotal = parseFloat(document.getElementById('valorTotalMeta').value);
    const principalNoDashboard = document.getElementById('metaPrincipalDashboard').checked;

    if (!nome || isNaN(valorTotal) || valorTotal <= 0) return mostrarAlerta('Nome e valor total válidos são obrigatórios.', 'warning');

    const idNumerico = id ? parseInt(id) : null;

    if (principalNoDashboard) { 
        dados.metasDePagamento.forEach(m => {
            m.principalNoDashboard = (m.id === idNumerico); 
        });
    }
    
    if (idNumerico) {
        const meta = dados.metasDePagamento.find(m => m.id === idNumerico);
        if (meta) { 
            meta.nome = nome; 
            meta.valorTotal = valorTotal; 
            meta.principalNoDashboard = principalNoDashboard; 
        }
    } else { 
        const novaMetaId = Date.now();
        dados.metasDePagamento.push({ id: novaMetaId, nome, valorTotal, valorPago: 0, principalNoDashboard });
        if (principalNoDashboard) { 
            dados.metasDePagamento.forEach(m => { if(m.id !== novaMetaId) m.principalNoDashboard = false; });
        }
    }
    
    salvarDados();
    closeModal('modalMeta');
    atualizarInterfaceCompleta();
    mostrarAlerta(`Meta ${id ? 'atualizada' : 'adicionada'}!`, 'success');
}

function removerMeta(metaId) {
    if (confirm('Remover esta meta? Pagamentos vinculados perderão o vínculo.')) {
        dados.metasDePagamento = dados.metasDePagamento.filter(m => m.id !== metaId);
        dados.pagamentos.forEach(p => { if (p.idMetaPagamento === metaId) p.idMetaPagamento = null; });
        salvarDados();
        atualizarInterfaceCompleta();
        mostrarAlerta('Meta removida.', 'success');
    }
}

function calcularSaldoDeMeta(metaId) {
    const meta = dados.metasDePagamento.find(m => m.id === metaId);
    if (!meta) return;
    meta.valorPago = dados.pagamentos.reduce((acc, p) => {
        if (p.idMetaPagamento === metaId && p.rateio) {
            acc += p.rateio.reduce((subAcc, r) => subAcc + (r.pago ? r.valor : 0), 0);
        }
        return acc;
    }, 0);
}
function calcularTodosSaldosDeMetas() {
    dados.metasDePagamento.forEach(meta => calcularSaldoDeMeta(meta.id));
}

function atualizarListaMetas() {
    const listaEl = document.getElementById('metasList');
    if (!listaEl) return;
    calcularTodosSaldosDeMetas();
    listaEl.innerHTML = dados.metasDePagamento.length === 0 ? '<p style="text-align:center;color:#666;">Nenhuma meta cadastrada.</p>' :
        dados.metasDePagamento.map(m => {
            const saldoDevedor = m.valorTotal - m.valorPago;
            const progresso = m.valorTotal > 0 ? (m.valorPago / m.valorTotal) * 100 : 0;
            return `
            <div class="item">
                <div class="item-info" style="padding-right:0;">
                    <div style="display:flex;justify-content:space-between;align-items:center; flex-wrap:wrap;">
                        <h4 style="margin-right:10px;">${m.nome} ${m.principalNoDashboard?'<i class="fas fa-star" style="color:#ffc107; font-size:0.8em;" title="Meta Principal"></i>':''}</h4>
                        <div class="item-actions" style="width:auto; margin-top:0; flex-shrink:0;">
                            <button class="btn btn-warning" style="padding: 6px 10px; font-size:0.8em;" onclick="openModalMeta(${m.id})"><i class="fas fa-edit"></i> Editar</button>
                            <button class="btn btn-danger" style="padding: 6px 10px; font-size:0.8em;" onclick="removerMeta(${m.id})"><i class="fas fa-trash"></i> Remover</button>
                        </div>
                    </div>
                    <div class="item-meta-details" style="margin-top:10px;">
                        <p><strong>Total da Meta:</strong> ${formatarMoeda(m.valorTotal)}</p>
                        <p><strong>Total Pago para esta Meta:</strong> ${formatarMoeda(m.valorPago)}</p>
                        <p><strong>Saldo Devedor da Meta:</strong> <span style="color:${saldoDevedor > 0 ? '#c53030':'#22543d'};font-weight:bold;">${formatarMoeda(saldoDevedor)}</span></p>
                    </div>
                    <div class="meta-progress-bar"><div class="meta-progress-fill" style="width:${progresso.toFixed(1)}%;" title="${progresso.toFixed(1)}% Concluído">${progresso.toFixed(0)}%</div></div>
                </div>
            </div>`;
        }).join('');
}
function popularSelectMetas() {
    const select = document.getElementById('vincularMetaPagamento');
    if (!select) return;
    const valorSelecionadoAntes = select.value; 
    select.innerHTML = '<option value="">Nenhuma meta específica</option>';
    dados.metasDePagamento.forEach(m => select.innerHTML += `<option value="${m.id}">${m.nome}</option>`);
    select.value = valorSelecionadoAntes; 
}


// --- INCC ---
// Suas funções analisarReajusteINCC, atualizarHistoricoAnalisesINCC existentes...
// (O código que você forneceu parece bom)
function analisarReajusteINCC() {
    const valorParcelaOriginalEl = document.getElementById('valorParcelaOriginal');
    const valorParcelaPagaEl = document.getElementById('valorParcelaPagaComINCC');
    const valorDoReajusteEl = document.getElementById('valorDoReajusteINCC');
    const percentualDoReajusteEl = document.getElementById('percentualDoReajusteINCC');

    const valorParcelaOriginal = parseFloat(valorParcelaOriginalEl.value);
    const valorParcelaPagaComINCC = parseFloat(valorParcelaPagaEl.value);

    valorDoReajusteEl.value = ''; 
    percentualDoReajusteEl.value = '';

    if (isNaN(valorParcelaOriginal) || valorParcelaOriginal <= 0 || 
        isNaN(valorParcelaPagaComINCC) || valorParcelaPagaComINCC < 0) {
        mostrarAlerta('Valores inválidos. O original deve ser > 0.', 'warning');
        return;
    }

    const valorReajuste = valorParcelaPagaComINCC - valorParcelaOriginal;
    const percentualReajuste = (valorParcelaOriginal !== 0) ? (valorReajuste / valorParcelaOriginal) * 100 : 0;

    valorDoReajusteEl.value = formatarMoeda(valorReajuste);
    percentualDoReajusteEl.value = `${percentualReajuste.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;
    
    const corReajuste = valorReajuste >= 0 ? '#c53030' : '#22543d'; 
    valorDoReajusteEl.style.color = corReajuste;
    percentualDoReajusteEl.style.color = corReajuste;

    const registro = {
        id: Date.now(), data: new Date().toLocaleDateString('pt-BR'), tipoCalculo: 'analiseReajusteParcela',
        valorParcelaOriginal, valorParcelaPaga: valorParcelaPagaComINCC, valorReajuste, percentualReajuste
    };
    if (!dados.historicoINCC) dados.historicoINCC = [];
    dados.historicoINCC.push(registro);
    salvarDados();
    atualizarHistoricoAnalisesINCC();
    mostrarAlerta('Análise de reajuste da parcela concluída!', 'success');
}

function atualizarHistoricoAnalisesINCC() {
    const container = document.getElementById('historicoAnalisesINCC');
    if (!container) return;
    const historicoFiltrado = dados.historicoINCC?.filter(h => h.tipoCalculo === 'analiseReajusteParcela') || [];

    if (historicoFiltrado.length === 0) {
        container.innerHTML = '<h3>Histórico de Análises de Reajuste</h3><p style="color: #666;">Nenhuma análise realizada.</p>';
        return;
    }
    container.innerHTML = `<h3>Histórico de Análises de Reajuste</h3>` +
        historicoFiltrado.slice(-5).reverse().map(h => `
            <div class="item"><div class="item-info">
                <h4>Análise de ${h.data}</h4>
                <p><strong>Original da Parcela:</strong> ${formatarMoeda(h.valorParcelaOriginal)}</p>
                <p><strong>Pago com INCC:</strong> ${formatarMoeda(h.valorParcelaPaga)}</p>
                <p><strong>Valor do Reajuste:</strong> <span style="color: ${h.valorReajuste >= 0 ? '#c53030' : '#22543d'}; font-weight: bold;">${h.valorReajuste >= 0 ? '+' : ''}${formatarMoeda(h.valorReajuste)}</span></p>
                <p><strong>Percentual de Reajuste:</strong> <span style="font-weight: bold; color: ${h.percentualReajuste >= 0 ? '#c53030' : '#22543d'};">${h.percentualReajuste.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</span></p>
            </div></div>`).join('');
}


// --- DASHBOARD (MODIFICADO E NOVAS FUNÇÕES) ---

// NOVA: Função para popular o seletor de meses do filtro do dashboard
function popularSelectMesDashboardFiltro() {
    const selectMes = document.getElementById('selectMesDashboardFiltro');
    if (!selectMes) return;

    const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    selectMes.innerHTML = '<option value="">Todos os Meses</option>';
    mesesNomes.forEach((nome, index) => {
        const option = document.createElement('option');
        option.value = index; // 0 para Janeiro
        option.textContent = nome;
        selectMes.appendChild(option);
    });
}

// NOVA: Função para popular o seletor de anos do filtro do dashboard
function popularSelectAnoDashboardFiltro() {
    const selectAno = document.getElementById('selectAnoDashboardFiltro');
    if (!selectAno) return;

    const anosUnicos = new Set();
    if (dados && dados.pagamentos && Array.isArray(dados.pagamentos)) {
        dados.pagamentos.forEach(p => {
            if (p.dataVencimento) {
                try {
                    anosUnicos.add(new Date(p.dataVencimento + "T00:00:00").getFullYear());
                } catch (e) { console.warn("Data de vencimento inválida:", p.dataVencimento); }
            }
        });
    }
    if (anosUnicos.size === 0) { // Adiciona ano atual se não houver dados ou anos
        anosUnicos.add(new Date().getFullYear());
    }

    selectAno.innerHTML = '<option value="">Todos os Anos</option>';
    Array.from(anosUnicos).sort((a, b) => b - a).forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        selectAno.appendChild(option);
    });
}

// MODIFICADA: atualizarDashboard agora aceita filtros
function atualizarDashboard(mesFiltro = "", anoFiltro = "") {
    const mesAlvo = (mesFiltro !== "" && mesFiltro !== null) ? parseInt(mesFiltro) : null;
    const anoAlvo = (anoFiltro !== "" && anoFiltro !== null) ? parseInt(anoFiltro) : null;

    let pagamentosParaCalculo = dados.pagamentos;

    if (anoAlvo !== null) {
        pagamentosParaCalculo = pagamentosParaCalculo.filter(p => {
            if (!p.dataVencimento) return false;
            try { return new Date(p.dataVencimento + "T00:00:00").getFullYear() === anoAlvo; }
            catch (e) { return false; }
        });
    }
    if (mesAlvo !== null) {
        pagamentosParaCalculo = pagamentosParaCalculo.filter(p => {
            if (!p.dataVencimento) return false;
            try { return new Date(p.dataVencimento + "T00:00:00").getMonth() === mesAlvo; }
            catch (e) { return false; }
        });
    }

    // Calcula totais para os cards com base nos pagamentos filtrados (ou todos se não houver filtro)
    const totalLancadoCards = pagamentosParaCalculo.reduce((acc, p) => acc + p.valor, 0);
    let totalPagoEfetivoCards = 0;
    pagamentosParaCalculo.forEach(p => {
        if (p.rateio && p.rateio.length > 0) {
            totalPagoEfetivoCards += p.rateio.reduce((accRateio, r) => accRateio + (r.pago ? r.valor : 0), 0);
        } else if (p.status === 'pago' && (!p.rateio || p.rateio.length === 0)) {
            totalPagoEfetivoCards += p.valor;
        }
    });
    const totalPendenteCards = totalLancadoCards - totalPagoEfetivoCards;

    document.getElementById('totalPago').textContent = formatarMoeda(totalPagoEfetivoCards);
    document.getElementById('totalPendente').textContent = formatarMoeda(totalPendenteCards);
    document.getElementById('totalGeral').textContent = formatarMoeda(totalLancadoCards);

    // --- Lógica para Progresso Geral Global e Meta Principal (NÃO FILTRADA POR MÊS/ANO) ---
    const totalLancadoGlobal = dados.pagamentos.reduce((acc, p) => acc + p.valor, 0);
    let totalPagoEfetivoGlobal = 0;
    dados.pagamentos.forEach(p => {
        if (p.rateio && p.rateio.length > 0) {
            totalPagoEfetivoGlobal += p.rateio.reduce((accRateio, r) => accRateio + (r.pago ? r.valor : 0), 0);
        } else if (p.status === 'pago' && (!p.rateio || p.rateio.length === 0) ) { 
            totalPagoEfetivoGlobal += p.valor;
        }
    });
    const progressoGlobal = totalLancadoGlobal > 0 ? (totalPagoEfetivoGlobal / totalLancadoGlobal) * 100 : 0;
    
    const progressFillEl = document.getElementById('progressFill');
    const progressTextEl = document.getElementById('progressText');
    if(progressFillEl) progressFillEl.style.width = `${progressoGlobal.toFixed(1)}%`;
    if(progressTextEl) progressTextEl.textContent = `${Math.round(progressoGlobal)}%`;
    
    const metaPrincipal = dados.metasDePagamento.find(m => m.principalNoDashboard);
    const cardMetaEl = document.getElementById('cardMetaPrincipalDashboard');
    if (metaPrincipal && cardMetaEl) {
        calcularSaldoDeMeta(metaPrincipal.id); 
        const saldoDevMeta = metaPrincipal.valorTotal - metaPrincipal.valorPago;
        const progMeta = metaPrincipal.valorTotal > 0 ? (metaPrincipal.valorPago / metaPrincipal.valorTotal) * 100 : 0;
        
        document.getElementById('nomeMetaPrincipalDashboard').innerHTML = `<i class="fas fa-piggy-bank"></i> ${metaPrincipal.nome}`;
        document.getElementById('saldoDevedorMetaPrincipal').textContent = formatarMoeda(saldoDevMeta);
        document.getElementById('valorTotalMetaPrincipal').textContent = formatarMoeda(metaPrincipal.valorTotal);
        document.getElementById('valorPagoMetaPrincipal').textContent = formatarMoeda(metaPrincipal.valorPago);
        document.getElementById('progressFillMetaPrincipal').style.width = `${progMeta.toFixed(1)}%`;
        document.getElementById('progressTextMetaPrincipal').textContent = `${Math.round(progMeta)}%`;
        cardMetaEl.style.display = 'block';
    } else if (cardMetaEl) {
        cardMetaEl.style.display = 'none';
    }
    atualizarProximosVencimentos(); // Esta função também é global
}

function atualizarProximosVencimentos() {
    // Seu código atualizarProximosVencimentos existente...
    const container = document.getElementById('proximosVencimentos');
    if (!container) return;
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const proximos30Dias = new Date(hoje); proximos30Dias.setDate(hoje.getDate() + 30);

    const vencimentos = dados.pagamentos
        .filter(p => p.status !== 'pago' && new Date(p.dataVencimento + "T00:00:00") <= proximos30Dias && new Date(p.dataVencimento + "T00:00:00") >= hoje)
        .sort((a,b) => new Date(a.dataVencimento + "T00:00:00") - new Date(b.dataVencimento + "T00:00:00")).slice(0,5);
    
    let html = '<h3>Próximos Vencimentos</h3>';
    if (vencimentos.length === 0) {
        html += '<p style="color: #666;">Nenhum vencimento nos próximos 30 dias.</p>';
    } else {
        html += vencimentos.map(p => {
            const dataV = new Date(p.dataVencimento + "T00:00:00");
            const diasRest = Math.ceil((dataV - hoje) / (1000*60*60*24));
            let msg = diasRest === 0 ? 'Vence hoje' : (diasRest === 1 ? 'Vence amanhã' : `Vence em ${diasRest} dias`);
            return `<div class="item" style="border-left:5px solid #667eea;margin-bottom:10px;"><div class="item-info" style="margin-bottom:0; padding-right:0;"><h4>${p.descricao}</h4><p><strong>Valor:</strong> ${formatarMoeda(p.valor)}</p><p><strong>Vencimento:</strong> ${dataV.toLocaleDateString('pt-BR')}</p><span class="status pendente" style="background-color:#ffe0b2;color:#b7791f;">${msg}</span></div></div>`;
        }).join('');
    }
    container.innerHTML = html;
}

// --- RELATÓRIOS ---
// Suas funções gerarRelatorioGeral, gerarRelatorioPagantes, getTipoNome, updateTipoPagamento existentes...
// (O código que você forneceu parece bom)
function gerarRelatorioGeral() {
    const container = document.getElementById('relatorioContent');
    if (!container) {
        console.error("Elemento #relatorioContent não encontrado!");
        return;
    }
    calcularTodosSaldosDeMetas(); 
    const totalLancado = dados.pagamentos.reduce((sum, p) => sum + p.valor, 0);
    let totalPagoEfetivo = 0;
    dados.pagamentos.forEach(p => {
        if (p.rateio && p.rateio.length > 0) {
            totalPagoEfetivo += p.rateio.reduce((sumRateio, r) => sumRateio + (r.pago ? r.valor : 0), 0);
        } else if (p.status === 'pago' && (!p.rateio || p.rateio.length === 0)) {
            totalPagoEfetivo += p.valor;
        }
    });
    const totalPendenteLancamentos = totalLancado - totalPagoEfetivo;
    const progressoLancamentos = totalLancado > 0 ? (totalPagoEfetivo / totalLancado) * 100 : 0;

    const valorTotalMetasDefinidas = dados.metasDePagamento.reduce((sum, meta) => sum + meta.valorTotal, 0);
    const totalAmortizadoMetas = dados.metasDePagamento.reduce((sum, meta) => sum + (meta.valorPago || 0), 0);
    const saldoDevedorTotalMetas = valorTotalMetasDefinidas - totalAmortizadoMetas;
    const progressoGeralMetas = valorTotalMetasDefinidas > 0 ? (totalAmortizadoMetas / valorTotalMetasDefinidas) * 100 : 0;

    const gastosPorTipo = {};
    dados.pagamentos.forEach(p => {
        const tipoNome = getTipoNome(p.tipo);
        if (!gastosPorTipo[tipoNome]) {
            gastosPorTipo[tipoNome] = { count: 0, totalLancado: 0, totalPago: 0 };
        }
        gastosPorTipo[tipoNome].count++;
        gastosPorTipo[tipoNome].totalLancado += p.valor;
        
        let pagoNestePagamentoParaTipo = 0;
        if (p.rateio && p.rateio.length > 0) {
            pagoNestePagamentoParaTipo = p.rateio.reduce((sumRateio, r) => sumRateio + (r.pago ? r.valor : 0), 0);
        } else if (p.status === 'pago' && (!p.rateio || p.rateio.length === 0)) {
            pagoNestePagamentoParaTipo = p.valor;
        }
        gastosPorTipo[tipoNome].totalPago += pagoNestePagamentoParaTipo;
    });

    let html = `<div class="card" style="margin-bottom:20px;text-align:left;background:white;color:#333;">
                    <h3><i class="fas fa-file-invoice-dollar"></i> Resumo Financeiro Geral (Lançamentos)</h3>
                    <p><strong>Total de Lançamentos de Pagamento:</strong> ${dados.pagamentos.length}</p>
                    <p><strong>Valor Total Lançado:</strong> ${formatarMoeda(totalLancado)}</p>
                    <p><strong>Total Efetivamente Pago:</strong> ${formatarMoeda(totalPagoEfetivo)}</p>
                    <p><strong>Total Pendente nos Lançamentos:</strong> ${formatarMoeda(totalPendenteLancamentos)}</p>
                    <p><strong>Progresso Geral dos Lançamentos:</strong> ${progressoLancamentos.toFixed(1)}%</p>
                </div>`;
    if (dados.metasDePagamento.length > 0) {
        html += `<div class="card" style="margin-bottom:20px;text-align:left;background:white;color:#333;">
                    <h3><i class="fas fa-bullseye"></i> Resumo Agregado das Metas</h3>
                    <p><strong>Quantidade de Metas Definidas:</strong> ${dados.metasDePagamento.length}</p>
                    <p><strong>Valor Total de Todas as Metas:</strong> ${formatarMoeda(valorTotalMetasDefinidas)}</p>
                    <p><strong>Total Amortizado das Metas (Pago):</strong> ${formatarMoeda(totalAmortizadoMetas)}</p>
                    <p><strong>Saldo Devedor Total das Metas:</strong> ${formatarMoeda(saldoDevedorTotalMetas)}</p>
                    <p><strong>Progresso Geral das Metas:</strong> ${progressoGeralMetas.toFixed(1)}%</p>
                </div>`;
    } else {
        html += `<div class="card" style="margin-bottom:20px;text-align:center;background:white;color:#666;"><p>Nenhuma meta cadastrada.</p></div>`;
    }
    html += `<div class="card" style="text-align:left;background:white;color:#333;">
                <h3><i class="fas fa-tasks"></i> Distribuição de Gastos Efetivos por Tipo</h3>`;
    if (Object.keys(gastosPorTipo).length > 0 && totalPagoEfetivo >= 0) {
        html += `<div class="pagamentos-list" style="margin-top:10px;">`; 
        for (const tipo in gastosPorTipo) {
            if (gastosPorTipo.hasOwnProperty(tipo)) {
                const dadosTipo = gastosPorTipo[tipo];
                const percentualSobreTotalPago = totalPagoEfetivo > 0 ? (dadosTipo.totalPago / totalPagoEfetivo) * 100 : 0;
                html += `
                <div class="item" style="flex-direction: row; align-items: center;">
                    <div class="item-info" style="padding-right:10px; margin-bottom:0; flex-grow:3;">
                        <h4 style="margin-bottom:5px;">${tipo}</h4>
                        <p><strong>Qtde. Lançamentos:</strong> ${dadosTipo.count}</p>
                        <p><strong>Total Pago (Tipo):</strong> ${formatarMoeda(dadosTipo.totalPago)}</p>
                    </div>
                    <div style="text-align:right; flex-grow:1;">
                        <p style="font-size:1.2em; font-weight:bold; color:#007bff;">${percentualSobreTotalPago.toFixed(1)}%</p>
                        <p style="font-size:0.8em; color:#555;">do total pago</p>
                    </div>
                </div>`;
            }
        }
        html += `</div>`;
    } else {
        html += `<p style="text-align:center; color:#666; margin-top:10px;">Nenhum pagamento efetivado.</p>`;
    }
    html += `</div>`;
    container.innerHTML = html;
}

function gerarRelatorioPagantes() {
    const container = document.getElementById('relatorioContent');
    if (!container) return;
    if (dados.pagantes.length === 0) {
        container.innerHTML = '<p style="color:#666; text-align:center;">Nenhum pagante cadastrado.</p>'; return;
    }
    let html = '<h3><i class="fas fa-users"></i> Relatório de Contribuições por Pagante e Tipo</h3>';
    dados.pagantes.forEach(pagante => {
        html += `<div class="card" style="margin-bottom:20px;text-align:left;background:white;color:#333;"><h4><i class="fas fa-user-circle"></i> ${pagante.apelido} <span style="font-weight:normal;font-size:0.9em;">(${pagante.nome})</span></h4>`;
        const contribuicoesPorTipo = {};
        let totalPagoPeloPagante = 0;

        dados.pagamentos.forEach(pgto => {
            pgto.rateio?.forEach(r => {
                if (r.pagante_id === pagante.id && r.pago && r.valor > 0) {
                    const tipoNome = getTipoNome(pgto.tipo);
                    if (!contribuicoesPorTipo[tipoNome]) contribuicoesPorTipo[tipoNome] = 0;
                    contribuicoesPorTipo[tipoNome] += r.valor;
                    totalPagoPeloPagante += r.valor;
                }
            });
        });

        if (Object.keys(contribuicoesPorTipo).length > 0) {
            html += '<ul style="list-style-position: inside; padding-left: 0; margin-top:10px;">';
            for (const tipo in contribuicoesPorTipo) {
                html += `<li style="margin-bottom: 5px;"><strong>${tipo}:</strong> ${formatarMoeda(contribuicoesPorTipo[tipo])}</li>`;
            }
            html += '</ul>';
            html += `<p style="margin-top:15px; border-top: 1px solid #eee; padding-top: 10px; font-weight:bold;">Total Geral Pago por ${pagante.apelido}: ${formatarMoeda(totalPagoPeloPagante)}</p>`;
        } else {
            html += `<p style="color:#666; margin-top:10px;">Nenhuma contribuição paga registrada.</p>`;
        }
        html += `</div>`;
    });
    container.innerHTML = html;
}

function getTipoNome(tipo) {
    const tipos = {'sinal':'Sinal de Entrada','entrada':'Parcela de Entrada','incc':'Reajuste INCC','juros':'Juros de Obras','registro':'Taxa de Registro','itbi':'ITBI','outros':'Outros Custos'};
    return tipos[tipo] || tipo || 'Não especificado';
}
function updateTipoPagamento() {
    const tipo = document.getElementById('tipoPagamento').value;
    const descInput = document.getElementById('descricaoPagamento');
    const sugestoes = {'sinal':'Sinal de Entrada do Imóvel','entrada':'Parcela de Entrada Mensal','incc':'Reajuste Mensal INCC','juros':'Juros de Obras','registro':'Taxa de Registro do Imóvel','itbi':'ITBI - Imposto de Transmissão','outros':''};
    if (!descInput.value || Object.values(sugestoes).includes(descInput.value) ){
        descInput.value = sugestoes[tipo] !== undefined ? sugestoes[tipo] : '';
    }
}


// --- ALERTAS, ATUALIZAÇÃO GERAL DA UI E INICIALIZAÇÃO ---
function mostrarAlerta(mensagem, tipo = 'success') {
    // Seu código mostrarAlerta existente...
    document.querySelectorAll('.alert').forEach(a => a.remove()); 
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`; // Você precisará de estilos CSS para .alert e .alert-success/warning/error
    alerta.innerHTML = `<i class="fas fa-${tipo==='success'?'check-circle':(tipo==='warning'?'exclamation-triangle':'exclamation-circle')}"></i> ${mensagem}`;
    alerta.style.position = 'fixed'; // Para sobrepor outros elementos
    alerta.style.top = '20px';
    alerta.style.right = '20px';
    alerta.style.padding = '15px';
    alerta.style.borderRadius = '5px';
    alerta.style.color = 'white';
    alerta.style.zIndex = '10000';
    alerta.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    if (tipo === 'success') alerta.style.backgroundColor = '#28a745';
    else if (tipo === 'warning') alerta.style.backgroundColor = '#ffc107';
    else if (tipo === 'error') alerta.style.backgroundColor = '#dc3545';
    else alerta.style.backgroundColor = '#6c757d';

    document.body.appendChild(alerta);
    setTimeout(() => alerta.remove(), 4000);
}

// MODIFICADA: atualizarInterfaceCompleta
function atualizarInterfaceCompleta() {
    calcularTodosSaldosDeMetas();
    atualizarListaPagantes();
    atualizarListaPagamentos();
    atualizarListaMetas();
    
    popularSelectAnoDashboardFiltro(); // ATUALIZA O SELETOR DE ANOS DO FILTRO

    // Atualiza o dashboard com os filtros atualmente selecionados (ou padrão "Todos")
    const mesSelect = document.getElementById('selectMesDashboardFiltro');
    const anoSelect = document.getElementById('selectAnoDashboardFiltro');
    const mesFiltro = mesSelect ? mesSelect.value : "";
    const anoFiltro = anoSelect ? anoSelect.value : "";
    atualizarDashboard(mesFiltro, anoFiltro); // CHAMA O DASHBOARD MODIFICADO

    atualizarHistoricoAnalisesINCC(); 
    popularSelectMetas(); 
    if (document.getElementById('relatorios')?.classList.contains('active')) {
        document.getElementById('relatorioContent').innerHTML = '<p style="text-align:center; color:#666;"><i>Gere um novo relatório para ver os dados atualizados.</i></p>';
    }
    if (document.getElementById('incc')?.classList.contains('active')) {
        const originalInccSpan = document.getElementById('formattedValorParcelaOriginalDisplay');
        const pagaInccSpan = document.getElementById('formattedValorParcelaPagaComINCCDisplay');
        if (document.getElementById('valorParcelaOriginal').value === '') {
            if(originalInccSpan) originalInccSpan.textContent = '';
        }
        if (document.getElementById('valorParcelaPagaComINCC').value === '') {
            if(pagaInccSpan) pagaInccSpan.textContent = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.container .nav-buttons')) { // Apenas na app.html
        carregarDados();
        
        // Inicialização dos filtros do Dashboard
        popularSelectMesDashboardFiltro();
        popularSelectAnoDashboardFiltro(); // Agora populado com dados carregados

        // Define valores iniciais para os filtros (ex: "Todos")
        const selectMesEl = document.getElementById('selectMesDashboardFiltro');
        const selectAnoEl = document.getElementById('selectAnoDashboardFiltro');
        if(selectMesEl) selectMesEl.value = ""; 
        if(selectAnoEl) selectAnoEl.value = "";

        // Listener para o botão de aplicar filtro do dashboard
        const btnAplicarFiltroEl = document.getElementById('btnAplicarFiltroDashboard');
        if (btnAplicarFiltroEl) {
            btnAplicarFiltroEl.addEventListener('click', () => {
                const mes = selectMesEl ? selectMesEl.value : "";
                const ano = selectAnoEl ? selectAnoEl.value : "";
                atualizarDashboard(mes, ano); // Chama o dashboard modificado
            });
        }
        
        showSection('dashboard', document.querySelector('.nav-btn[onclick*="dashboard"]')); // Mostra dashboard com filtros iniciais
        
        // Listeners globais para modais
        window.onclick = event => { 
            if (event.target.classList.contains('modal') && event.target.classList.contains('active-modal-display')) {
                closeModal(event.target.id); 
            }
        };
        window.addEventListener('keydown', event => { 
            if (event.key === 'Escape' || event.key === 'Esc') {
                document.querySelectorAll('.modal.active-modal-display').forEach(m => closeModal(m.id));
            }
        });
        document.querySelectorAll('.modal .close').forEach(btn => {
            btn.addEventListener('keydown', function(e){ 
                if(e.key==='Enter'||e.key===' ') closeModal(this.closest('.modal').id); 
            });
        });

        // Listener para botão de logout (movido do HTML para cá)
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                if (typeof deslogarUsuario === 'function') { // deslogarUsuario virá de auth.js
                    deslogarUsuario();
                } else {
                    console.error('Função deslogarUsuario não definida. Verifique auth.js');
                    // Fallback se auth.js não carregar ou a função não existir
                    // localStorage.removeItem('usuarioLogado'); // Exemplo, depende da sua lógica de auth
                    // window.location.href = 'index.html'; 
                }
            });
        }
    }
});

// --- FUNÇÕES DE IMPORTAÇÃO/EXPORTAÇÃO DE DADOS ---
// Suas funções exportarDadosParaJson, importarDadosDeJson, limparDadosAplicacao existentes...
// (O código que você forneceu parece bom)
function exportarDadosParaJson() {
    if (!confirm("Deseja exportar todos os dados da aplicação para um arquivo JSON?")) {
        return;
    }
    calcularTodosSaldosDeMetas(); 
    const nomeArquivo = `financiamento_dados_${new Date().toISOString().slice(0,10)}.json`;
    const dadosJson = JSON.stringify(dados, null, 2); 
    const blob = new Blob([dadosJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarAlerta('Dados exportados com sucesso! Verifique seus downloads.', 'success');
}

function importarDadosDeJson() {
    const inputArquivo = document.getElementById('importarArquivoJson');
    if (!inputArquivo.files || inputArquivo.files.length === 0) {
        mostrarAlerta('Por favor, selecione um arquivo JSON para importar.', 'warning');
        return;
    }
    const arquivo = inputArquivo.files[0];
    if (arquivo.type !== "application/json") {
        mostrarAlerta('Tipo de arquivo inválido. Por favor, selecione um arquivo .json.', 'warning');
        inputArquivo.value = ''; 
        return;
    }
    if (!confirm("ATENÇÃO: Isso substituirá TODOS os dados atuais. Deseja continuar? \n\nRecomenda-se ter um backup (exportação) dos dados atuais.")) {
        inputArquivo.value = ''; 
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const dadosImportados = JSON.parse(event.target.result);
            if (typeof dadosImportados === 'object' && dadosImportados !== null &&
                Array.isArray(dadosImportados.pagantes) && Array.isArray(dadosImportados.pagamentos) &&
                Array.isArray(dadosImportados.metasDePagamento) && Array.isArray(dadosImportados.historicoINCC) && 
                typeof dadosImportados.configuracoes === 'object' && dadosImportados.configuracoes !== null) {
                
                dados = dadosImportados; 
                salvarDados();       
                calcularTodosSaldosDeMetas(); 
                atualizarInterfaceCompleta(); 
                showSection('dashboard', document.querySelector('.nav-btn[onclick*="dashboard"]')); 
                mostrarAlerta('Dados importados com sucesso!', 'success');
            } else {
                mostrarAlerta('Erro: O arquivo JSON não parece ter a estrutura de dados esperada.', 'error');
            }
        } catch (e) {
            console.error("Erro ao parsear JSON importado:", e);
            mostrarAlerta('Erro ao ler o arquivo JSON. Verifique se está formatado corretamente.', 'error');
        } finally {
            inputArquivo.value = ''; 
        }
    };
    reader.onerror = function() {
        mostrarAlerta('Ocorreu um erro ao tentar ler o arquivo selecionado.', 'error');
        inputArquivo.value = '';
    };
    reader.readAsText(arquivo);
}

function limparDadosAplicacao() {
    if (confirm("Tem certeza de que deseja limpar TODOS os dados da aplicação? Esta ação não pode ser desfeita.")) {
        localStorage.removeItem('financiamentoData');
        dados = {
            pagantes: [], pagamentos: [], metasDePagamento: [],
            configuracoes: { valorImovel: 0, valorFinanciado: 0, inccBase: 100 },
            historicoINCC: []
        };
        atualizarInterfaceCompleta();
        mostrarAlerta('Todos os dados da aplicação foram limpos com sucesso!', 'success');
    } else {
        mostrarAlerta('Operação de limpeza de dados cancelada.', 'warning');
    }
}