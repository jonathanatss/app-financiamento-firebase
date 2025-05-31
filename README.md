# Controle de Financiamento de Imóvel 🏠💰

Aplicação web para auxiliar no acompanhamento e gerenciamento de todas as despesas relacionadas ao financiamento de um imóvel, desde a entrada até custos adicionais como taxas e impostos.

**Acesse a aplicação online em:** [https://jonathanatss.github.io/app-financiamento-firebase/](https://jonathanatss.github.io/app-financiamento-firebase/)

## ✨ Funcionalidades Principais

* **Autenticação de Usuários:**
    * Cadastro de novos usuários.
    * Login seguro com e-mail e senha.
    * Verificação de e-mail após o cadastro.
    * Funcionalidade de recuperação de senha ("Esqueci minha senha").
* **Dashboard (Resumo Geral):**
    * Visão geral dos totais pagos, pendentes e lançados.
    * Progresso geral dos pagamentos.
    * Destaque para a meta de pagamento principal com barra de progresso.
    * Lista de próximos vencimentos.
* **Gerenciamento de Pagantes:**
    * Cadastro, edição e remoção de pessoas ou entidades que contribuem para os pagamentos.
* **Controle de Pagamentos Detalhado:**
    * Adição e edição de pagamentos com tipo (Sinal, Entrada, INCC, Juros, ITBI, Registro, Outros).
    * Descrição, valor total e data de vencimento.
    * Vínculo opcional de pagamentos a metas financeiras.
    * **Rateio de Pagamentos:** Distribuição do valor de um pagamento entre múltiplos pagantes, com controle individual de status de pagamento (pago/não pago) para cada contribuição.
    * Status visual para pagamentos (Pago, Pendente, Parcial, Atrasado).
* **Gerenciamento de Metas Financeiras:**
    * Criação, edição e remoção de metas de pagamento.
    * Acompanhamento do progresso de cada meta.
    * Opção de marcar uma meta como principal para exibição destacada no Dashboard.
* **Analisador de Reajuste INCC:**
    * Ferramenta para calcular o impacto do reajuste do INCC em uma parcela.
    * Histórico das análises de reajuste.
* **Relatórios:**
    * **Relatório Geral:** Resumo financeiro, progresso das metas e distribuição de gastos por tipo.
    * **Relatório por Pagante:** Detalhamento das contribuições por pagante e tipo de despesa.
* **Gerenciamento de Dados da Aplicação (Local):**
    * **Exportar Dados:** Salva todos os dados da aplicação (lançados no seu navegador) em um arquivo JSON para backup.
    * **Importar Dados:** Carrega dados de um arquivo JSON para o seu navegador.

## 🛠️ Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript (Vanilla JS)
* **Firebase:**
    * Firebase Authentication (para cadastro, login, verificação de e-mail, recuperação de senha)
* Font Awesome (ícones)

## 📋 Como Usar a Aplicação Online

1.  **Acesse o link da aplicação:** [https://jonathanatss.github.io/app-financiamento-firebase/](https://jonathanatss.github.io/app-financiamento-firebase/)
2.  **Registre-se:** Crie uma conta usando um e-mail e senha válidos. Um e-mail de verificação será enviado para você (verifique sua caixa de entrada e spam).
3.  **Faça o login:** Utilize as credenciais que você acabou de criar.
4.  Após o login, você será direcionado para a página principal da aplicação.
5.  **Explore e utilize as funcionalidades:**
    * **Pagantes:** Cadastre as pessoas ou entidades que contribuirão para os pagamentos.
    * **Metas:** Defina seus grandes objetivos financeiros (ex: Valor total da entrada, Custos de cartório).
    * **Pagamentos:** Lance todas as despesas do financiamento, detalhando o tipo, valor, data de vencimento, quem está pagando (rateio) e se está vinculado a alguma meta. Não se esqueça de marcar os pagamentos e as contribuições individuais como "pagas" conforme elas ocorrerem.
    * **Reajuste INCC:** Use a calculadora para entender o impacto dos reajustes.
    * **Relatórios:** Acompanhe o progresso geral e os gastos por pagante.
    * **Dados:** Regularmente, **exporte seus dados** para ter um backup seguro. Se precisar, você pode importar dados de um backup anterior.
6.  **Verifique seu e-mail:** Clique no link enviado pelo Firebase para confirmar seu endereço de e-mail. Isso garante que sua conta está verificada e ajuda na recuperação de senha.
7.  **Recuperação de Senha:** Se esquecer sua senha, utilize o link "Esqueci minha senha" na tela de login.

## ⚠️ Importante sobre o Armazenamento de Dados

Atualmente, todos os dados de financiamento (pagantes, pagamentos, metas, etc.) que você insere na aplicação são **armazenados localmente no seu navegador** (usando `localStorage`). Isso significa que:
* Os dados são específicos para o navegador e o dispositivo que você está usando.
* Se você limpar o cache do seu navegador ou usar um navegador diferente, os dados não estarão lá.
* **É crucial usar a função "Exportar Dados" regularmente para fazer backup das suas informações.**

A autenticação com Firebase controla o *acesso* à ferramenta, mas (nesta versão) não armazena seus dados de financiamento na nuvem por usuário.

## 🖼️ Screenshots (Opcional)

*(Você pode adicionar screenshots da sua aplicação aqui para ilustrar as principais telas e funcionalidades.)*

* *Ex: Tela de Login*
* *Ex: Dashboard Principal*
* *Ex: Tela de Cadastro de Pagamento com Rateio*

## 🔮 Próximas Melhorias (Sugestões)

* **Armazenamento de Dados na Nuvem por Usuário:** Migrar o armazenamento dos dados de financiamento do `localStorage` para o **Firebase Firestore** ou **Realtime Database**. Isso permitiria que os dados de cada usuário fossem salvos na nuvem, associados à sua conta, e acessíveis de múltiplos dispositivos.
* Implementar gráficos nos relatórios para melhor visualização dos dados.
* Adicionar notificações/lembretes para pagamentos próximos do vencimento.
* Permitir personalização de categorias de pagamento.

---
