// js/app.js
let dados = {
    pagantes: [],
    pagamentos: [],
    metasDePagamento: [],
    configuracoes: { valorImovel: 0, valorFinanciado: 0, inccBase: 100 },
    historicoINCC: [] 
};

// NOVA FUNÇÃO HELPER
function updateFormattedInputDisplay(inputId, displaySpanId, prefixText = "Equivalente a: R$ ") {
    const inputElement = document.getElementById(inputId);
    const displayElement = document.getElementById(displaySpanId);
    
    if (!inputElement || !displayElement) {
        // console.warn("Input or display element not found for", inputId, displaySpanId);
        return;
    }

    const rawValue = parseFloat(inputElement.value);

    if (inputElement.value.trim() === '' || isNaN(rawValue)) { // Handle empty or non-numeric input
        displayElement.textContent = ''; // Clear display if input is empty or not a number
    } else {
        displayElement.textContent = prefixText + rawValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}


function carregarDados() {
    try {
        const dadosSalvos = localStorage.getItem('financiamentoData');
        if (dadosSalvos) {
            const dadosParseados = JSON.parse(dadosSalvos);
            dados = {
                pagantes: [], pagamentos: [], metasDePagamento: [], configuracoes: { valorImovel: 0, valorFinanciado: 0, inccBase: 100 }, historicoINCC: [],
                ...dadosParseados
            };
            if (!Array.isArray(dados.pagantes)) dados.pagantes = [];
            if (!Array.isArray(dados.pagamentos)) dados.pagamentos = [];
            if (!Array.isArray(dados.metasDePagamento)) dados.metasDePagamento = [];
            if (!Array.isArray(dados.historicoINCC)) dados.historicoINCC = [];
        }
    } catch (error) {
        console.error("Erro ao carregar dados do localStorage:", error);
        mostrarAlerta("Erro ao carregar dados. Alguns dados podem ter sido resetados.", "error");
        dados = { pagantes: [], pagamentos: [], metasDePagamento: [], configuracoes: { valorImovel: 0, valorFinanciado: 0, inccBase: 100 }, historicoINCC: [] };
    }
}

function salvarDados() {
    localStorage.setItem('financiamentoData', JSON.stringify(dados));
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) sectionToShow.classList.add('active');
    const activeButton = document.querySelector(`.nav-btn[onclick*="'${sectionId}'"]`);
    if(activeButton) activeButton.classList.add('active');
    atualizarInterfaceCompleta();
}

function openModal(modalId) {
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
            // A chamada para gerenciarCamposContribuicao é feita em abrirModalEdicaoPagamento
            // ou implicitamente ao abrir para novo se não houver ID de edição.
            // Se estiver abrindo para um novo pagamento, gerenciarCamposContribuicao será chamado por abrirModalEdicaoPagamento (com null)
            // ou se for um clique direto em "Adicionar Pagamento" sem passar por abrirModalEdicaoPagamento, precisa garantir que campos de contribuição
            // são inicializados se necessário.
            // A função abrirModalEdicaoPagamento já lida com a lógica de popular e exibir os campos de contribuição.
            // Apenas certificando que `gerenciarCamposContribuicao` é chamado corretamente no fluxo de edição/novo.
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
            // A limpeza do span e atualização é feita em openModalMeta
            break;
    }
    modal.style.display = 'block';
    modal.classList.add('active-modal-display');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active-modal-display');
    }
    limparFormularios(modalId);
}

function limparFormularios(modalId) { // ATUALIZADA
    const modal = document.getElementById(modalId);
    if (modal) {
        const form = modal.querySelector('form');
        if (form) form.reset();

        // Limpa os spans de display formatado dentro do modal específico
        const formattedSpans = modal.querySelectorAll('.formatted-input-display');
        formattedSpans.forEach(span => span.textContent = '');

        if (modalId === 'modalPagamento') {
            document.getElementById('idPagamentoEditando').value = '';
            document.getElementById('camposContribuicaoPagantes').innerHTML = ''; // Limpa campos dinâmicos
            document.getElementById('blocoContribuicoesPagantes').style.display = 'none';
            // O span formattedValorPagamentoDisplay é limpo pelo querySelectorAll acima
            validarSomaContribuicoes(); 
        } else if (modalId === 'modalPagante') {
            document.getElementById('idPaganteEditando').value = '';
        } else if (modalId === 'modalMeta') {
            document.getElementById('idMeta').value = '';
            document.getElementById('metaPrincipalDashboard').checked = false;
            // O span formattedValorTotalMetaDisplay é limpo pelo querySelectorAll acima
        }
    }
}

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

function abrirModalEdicaoPagamento(pagamentoId) { // ATUALIZADA
    const form = document.getElementById('formPagamento');
    form.reset(); 
    document.getElementById('idPagamentoEditando').value = pagamentoId || '';
    
    const formattedDisplaySpan = document.getElementById('formattedValorPagamentoDisplay');
    if (formattedDisplaySpan) formattedDisplaySpan.textContent = ''; // Limpa o span de formatação do valor total
    document.getElementById('camposContribuicaoPagantes').innerHTML = ''; // Limpa os campos de contribuição e seus spans de formatação


    if (pagamentoId) {
        const pagamento = dados.pagamentos.find(p => p.id === pagamentoId);
        if (pagamento) {
            document.getElementById('tipoPagamento').value = pagamento.tipo;
            document.getElementById('descricaoPagamento').value = pagamento.descricao;
            document.getElementById('valorPagamento').value = pagamento.valor;
            document.getElementById('dataPagamento').value = pagamento.dataVencimento;
            document.getElementById('vincularMetaPagamento').value = pagamento.idMetaPagamento || "";
            updateFormattedInputDisplay('valorPagamento', 'formattedValorPagamentoDisplay'); // Atualiza o span para o valor preenchido
        } else {
            mostrarAlerta('Pagamento não encontrado para edição!', 'error');
            document.getElementById('idPagamentoEditando').value = '';
        }
    }
    updateTipoPagamento(); // Pode preencher a descrição
    openModal('modalPagamento'); // Abre o modal
     // gerenciarCamposContribuicao é chamado dentro de openModal se for para edição ou aqui se for novo
    gerenciarCamposContribuicao(pagamentoId ? dados.pagamentos.find(p=>p.id === parseInt(pagamentoId)) : null);
}

function gerenciarCamposContribuicao(pagamentoExistente = null) { // ATUALIZADA
    const containerCampos = document.getElementById('camposContribuicaoPagantes');
    const blocoContribuicoes = document.getElementById('blocoContribuicoesPagantes');
    const valorTotalInput = document.getElementById('valorPagamento');
    containerCampos.innerHTML = ''; // Limpa campos anteriores e seus spans de formatação

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
        } else if (!pagamentoExistente && index === 0 && valorTotalAtual > 0 && dados.pagantes.length > 0) {
            // Se for novo pagamento e mais de um pagante, e valor total preenchido, atribui ao primeiro.
            // Isso é mais uma sugestão, o usuário ajustará.
            // valorContribuido = valorTotalAtual; // Removido para não pré-preencher automaticamente se não for edição
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
        updateFormattedInputDisplay(inputId, displaySpanId); // Atualiza o display formatado para o valor inicial
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
            return mostrarAlerta('A soma das contribuições dos pagantes (R$ ' + somaContribParaValidacao.toFixed(2) + ') não corresponde ao Valor Total do pagamento (R$ ' + valor.toFixed(2) + ').', 'warning');
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
    atualizarDashboard();
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
                    <p><strong>Valor Total:</strong> R$ ${p.valor.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
                    <p><strong>Vencimento:</strong> ${dataVenc.toLocaleDateString('pt-BR')}</p>
                    <span class="status ${sClass}">${sText}</span>
                    ${(p.rateio && p.rateio.length > 0) ? `
                        <div data-rateio-container="true"><strong>Rateio (Contribuições):</strong>
                        ${p.rateio.map(r => {
                            const percentualContribuicao = (p.valor > 0 && r.valor > 0) ? (r.valor / p.valor) * 100 : 0;
                            return `
                            <div class="rateio-detalhe-item" style="background:${r.pago ? '#e6fffa':'#fff5f5'};">
                                <span>${r.nome}: R$ ${r.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})} 
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

function openModalMeta(metaId = null) { // ATUALIZADA
    const form = document.getElementById('formMeta'); form.reset();
    document.getElementById('idMeta').value = metaId || '';
    
    const formattedDisplaySpan = document.getElementById('formattedValorTotalMetaDisplay');
    if(formattedDisplaySpan) formattedDisplaySpan.textContent = ''; // Limpa o span de formatação

    if (metaId) {
        const meta = dados.metasDePagamento.find(m => m.id === metaId);
        if (meta) {
            document.getElementById('nomeMeta').value = meta.nome;
            document.getElementById('valorTotalMeta').value = meta.valorTotal;
            document.getElementById('metaPrincipalDashboard').checked = meta.principalNoDashboard || false;
            updateFormattedInputDisplay('valorTotalMeta', 'formattedValorTotalMetaDisplay'); // Atualiza o span para o valor preenchido
        }
    } else {
        document.getElementById('metaPrincipalDashboard').checked = false;
    }
    openModal('modalMeta');
}

function handleMetaPrincipalCheckbox(checkbox) {
    // A lógica de desmarcar outras é feita no salvarMeta para garantir consistência
}

function salvarMeta(event) {
    event.preventDefault();
    const id = document.getElementById('idMeta').value;
    const nome = document.getElementById('nomeMeta').value.trim();
    const valorTotal = parseFloat(document.getElementById('valorTotalMeta').value);
    const principalNoDashboard = document.getElementById('metaPrincipalDashboard').checked;

    if (!nome || isNaN(valorTotal) || valorTotal <= 0) return mostrarAlerta('Nome e valor total válidos são obrigatórios para a meta.', 'warning');

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
        if (principalNoDashboard) { // Se a nova foi marcada como principal, garantir que é a única
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
                        <p><strong>Total da Meta:</strong> R$ ${m.valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                        <p><strong>Total Pago para esta Meta:</strong> R$ ${m.valorPago.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                        <p><strong>Saldo Devedor da Meta:</strong> <span style="color:${saldoDevedor > 0 ? '#c53030':'#22543d'};font-weight:bold;">R$ ${saldoDevedor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></p>
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

    valorDoReajusteEl.value = `R$ ${valorReajuste.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
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
                <p><strong>Original da Parcela:</strong> R$ ${h.valorParcelaOriginal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                <p><strong>Pago com INCC:</strong> R$ ${h.valorParcelaPaga.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                <p><strong>Valor do Reajuste:</strong> <span style="color: ${h.valorReajuste >= 0 ? '#c53030' : '#22543d'}; font-weight: bold;">${h.valorReajuste >= 0 ? '+' : ''}R$ ${h.valorReajuste.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></p>
                <p><strong>Percentual de Reajuste:</strong> <span style="font-weight: bold; color: ${h.percentualReajuste >= 0 ? '#c53030' : '#22543d'};">${h.percentualReajuste.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</span></p>
            </div></div>`).join('');
}

function atualizarDashboard() {
    const totalLancado = dados.pagamentos.reduce((acc, p) => acc + p.valor, 0);
    let totalPagoEfetivo = 0;
    dados.pagamentos.forEach(p => {
        if (p.rateio && p.rateio.length > 0) {
            totalPagoEfetivo += p.rateio.reduce((accRateio, r) => accRateio + (r.pago ? r.valor : 0), 0);
        } else if (p.status === 'pago' && (!p.rateio || p.rateio.length === 0) ) { 
            totalPagoEfetivo += p.valor;
        }
    });
    const totalPendente = totalLancado - totalPagoEfetivo;
    const progresso = totalLancado > 0 ? (totalPagoEfetivo / totalLancado) * 100 : 0;

    document.getElementById('totalPago').textContent = `R$ ${totalPagoEfetivo.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
    document.getElementById('totalPendente').textContent = `R$ ${totalPendente.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
    document.getElementById('totalGeral').textContent = `R$ ${totalLancado.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
    document.getElementById('progressFill').style.width = `${progresso}%`;
    document.getElementById('progressText').textContent = `${Math.round(progresso)}%`;
    
    const metaPrincipal = dados.metasDePagamento.find(m => m.principalNoDashboard);
    const cardMetaEl = document.getElementById('cardMetaPrincipalDashboard');
    if (metaPrincipal && cardMetaEl) {
        calcularSaldoDeMeta(metaPrincipal.id); 
        const saldoDevMeta = metaPrincipal.valorTotal - metaPrincipal.valorPago;
        const progMeta = metaPrincipal.valorTotal > 0 ? (metaPrincipal.valorPago / metaPrincipal.valorTotal) * 100 : 0;
        document.getElementById('nomeMetaPrincipalDashboard').innerHTML = `<i class="fas fa-piggy-bank"></i> ${metaPrincipal.nome}`;
        document.getElementById('saldoDevedorMetaPrincipal').textContent = `R$ ${saldoDevMeta.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        document.getElementById('valorTotalMetaPrincipal').textContent = `R$ ${metaPrincipal.valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        document.getElementById('valorPagoMetaPrincipal').textContent = `R$ ${metaPrincipal.valorPago.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
        document.getElementById('progressFillMetaPrincipal').style.width = `${progMeta.toFixed(1)}%`;
        document.getElementById('progressTextMetaPrincipal').textContent = `${Math.round(progMeta)}%`;
        cardMetaEl.style.display = 'block';
    } else if (cardMetaEl) {
        cardMetaEl.style.display = 'none';
    }
    atualizarProximosVencimentos();
}

function atualizarProximosVencimentos() {
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
            return `<div class="item" style="border-left:5px solid #667eea;margin-bottom:10px;"><div class="item-info" style="margin-bottom:0; padding-right:0;"><h4>${p.descricao}</h4><p><strong>Valor:</strong> R$ ${p.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p><p><strong>Vencimento:</strong> ${dataV.toLocaleDateString('pt-BR')}</p><span class="status pendente" style="background-color:#ffe0b2;color:#b7791f;">${msg}</span></div></div>`;
        }).join('');
    }
    container.innerHTML = html;
}

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
                    <p><strong>Valor Total Lançado:</strong> R$ ${totalLancado.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                    <p><strong>Total Efetivamente Pago (Soma das Contribuições Pagas):</strong> R$ ${totalPagoEfetivo.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                    <p><strong>Total Pendente nos Lançamentos:</strong> R$ ${totalPendenteLancamentos.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                    <p><strong>Progresso Geral dos Lançamentos:</strong> ${progressoLancamentos.toFixed(1)}%</p>
                </div>`;

    if (dados.metasDePagamento.length > 0) {
        html += `<div class="card" style="margin-bottom:20px;text-align:left;background:white;color:#333;">
                    <h3><i class="fas fa-bullseye"></i> Resumo Agregado das Metas</h3>
                    <p><strong>Quantidade de Metas Definidas:</strong> ${dados.metasDePagamento.length}</p>
                    <p><strong>Valor Total de Todas as Metas:</strong> R$ ${valorTotalMetasDefinidas.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                    <p><strong>Total Amortizado das Metas (Pago):</strong> R$ ${totalAmortizadoMetas.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                    <p><strong>Saldo Devedor Total das Metas:</strong> R$ ${saldoDevedorTotalMetas.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                    <p><strong>Progresso Geral das Metas:</strong> ${progressoGeralMetas.toFixed(1)}%</p>
                </div>`;
    } else {
        html += `<div class="card" style="margin-bottom:20px;text-align:center;background:white;color:#666;"><p>Nenhuma meta de pagamento cadastrada para resumir.</p></div>`;
    }

    html += `<div class="card" style="text-align:left;background:white;color:#333;">
                <h3><i class="fas fa-tasks"></i> Distribuição de Gastos Efetivos por Tipo</h3>`;
    if (Object.keys(gastosPorTipo).length > 0 && totalPagoEfetivo >= 0) { // Permitir totalPagoEfetivo ser 0
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
                        <p><strong>Total Pago (Tipo):</strong> R$ ${dadosTipo.totalPago.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}</p>
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
        html += `<p style="text-align:center; color:#666; margin-top:10px;">Nenhum pagamento efetivado para detalhar por tipo.</p>`;
    }
    html += `</div>`;
    container.innerHTML = html;
}

function gerarRelatorioPagantes() {
    const container = document.getElementById('relatorioContent');
    if (!container) return;
    if (dados.pagantes.length === 0) {
        container.innerHTML = '<p style="color:#666; text-align:center;">Nenhum pagante cadastrado para gerar relatório.</p>'; return;
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
                html += `<li style="margin-bottom: 5px;"><strong>${tipo}:</strong> R$ ${contribuicoesPorTipo[tipo].toLocaleString('pt-BR',{minimumFractionDigits:2})}</li>`;
            }
            html += '</ul>';
            html += `<p style="margin-top:15px; border-top: 1px solid #eee; padding-top: 10px; font-weight:bold;">Total Geral Pago por ${pagante.apelido}: R$ ${totalPagoPeloPagante.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>`;
        } else {
            html += `<p style="color:#666; margin-top:10px;">Nenhuma contribuição paga registrada para este pagante.</p>`;
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
function mostrarAlerta(mensagem, tipo = 'success') {
    document.querySelectorAll('.alert').forEach(a => a.remove()); // Remove alertas antigos
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.innerHTML = `<i class="fas fa-${tipo==='success'?'check-circle':(tipo==='warning'?'exclamation-triangle':'exclamation-circle')}"></i> ${mensagem}`;
    
    // Adiciona o alerta ao body para que o position:fixed funcione globalmente
    // ou a um container específico se a position:fixed não for desejada.
    // Se o alerta estiver dentro de .auth-box no index.html, ele não será fixed.
    // Para app.html, ele será fixed no topo.
    const containerParaAlerta = document.querySelector('.auth-box') || document.body;
    if (containerParaAlerta === document.body) { // Alerta global para app.html
        document.body.appendChild(alerta);
    } else { // Alerta dentro do auth-box para index.html
        //  No index.html, já temos um div #auth-feedback. Podemos usá-lo diretamente.
        //  Esta função mostrarAlerta é mais genérica.
        //  Para o caso específico do index.html, a função displayAuthFeedback é mais adequada.
        //  Esta aqui servirá bem para app.html
        document.body.appendChild(alerta); // Ainda assim, anexa ao body para ser global.
    }


    setTimeout(() => alerta.remove(), 4000);
}

function atualizarInterfaceCompleta() {
    calcularTodosSaldosDeMetas();
    atualizarListaPagantes();
    atualizarListaPagamentos();
    atualizarListaMetas();
    atualizarDashboard();
    atualizarHistoricoAnalisesINCC(); 
    popularSelectMetas(); 
    if (document.getElementById('relatorios')?.classList.contains('active')) {
        document.getElementById('relatorioContent').innerHTML = '<p style="text-align:center; color:#666;"><i>Gere um novo relatório para ver os dados atualizados.</i></p>';
    }
    // Limpar spans de formatação na seção INCC se ela estiver ativa e for apropriado
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
    // Esta verificação é importante. Se estivermos na página app.html,
    // a lógica de carregamento de dados e inicialização da UI principal deve ocorrer.
    // O auth.js (que você vai criar) cuidará do redirecionamento.
    // Se esta página (app.html) for carregada, significa que o usuário deve estar autenticado.
    if (document.querySelector('.container')) { // Verifica se é a página da aplicação principal
        carregarDados();
        showSection('dashboard'); // Ou a última seção visitada, se você salvar essa preferência
    }

    // Event listeners globais para modais (fechar com ESC ou clique fora)
    // Movidos para cá para garantir que são adicionados apenas uma vez
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
});

// --- FUNÇÕES DE IMPORTAÇÃO/EXPORTAÇÃO DE DADOS ---

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

    if (!confirm("ATENÇÃO: Isso substituirá TODOS os dados atuais da aplicação. Deseja continuar? \n\nRecomenda-se ter um backup (exportação) dos dados atuais antes de prosseguir.")) {
        inputArquivo.value = ''; 
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const dadosImportados = JSON.parse(event.target.result);

            if (typeof dadosImportados === 'object' && dadosImportados !== null &&
                Array.isArray(dadosImportados.pagantes) &&
                Array.isArray(dadosImportados.pagamentos) &&
                Array.isArray(dadosImportados.metasDePagamento) &&
                Array.isArray(dadosImportados.historicoINCC) && 
                typeof dadosImportados.configuracoes === 'object' && dadosImportados.configuracoes !== null) {
                
                dados = dadosImportados; 
                salvarDados();       
                calcularTodosSaldosDeMetas(); 
                atualizarInterfaceCompleta(); 
                
                showSection('dashboard'); 

                mostrarAlerta('Dados importados com sucesso!', 'success');
            } else {
                mostrarAlerta('Erro: O arquivo JSON não parece ter a estrutura de dados esperada para esta aplicação.', 'error');
            }
        } catch (e) {
            console.error("Erro ao parsear JSON importado:", e);
            mostrarAlerta('Erro ao ler o arquivo JSON. Verifique se o arquivo está formatado corretamente.', 'error');
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