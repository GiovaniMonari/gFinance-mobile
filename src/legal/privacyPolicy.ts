/**
 * Econva — Política de Privacidade
 *
 * The single source of this document, same rules as the Termos de Uso: the
 * version, the sections and the pending fields all live here and nowhere else.
 *
 * Two things this text is careful about:
 *
 *   It describes only what the application actually does. Every third party
 *   named below is one the project really uses — infrastructure, the Open
 *   Finance connector and transactional email — and no security guarantee is
 *   promised that the product cannot make.
 *
 *   Acknowledging this document is not consent to everything. It tells the
 *   user how their data is processed; where the law requires consent for a
 *   specific activity, that consent is asked for separately at the moment of
 *   the activity — the Open Finance connection being the obvious case.
 */

import type { LegalDocument } from './types';

export const privacyPolicy: LegalDocument = {
  key: 'privacy',
  title: 'Política de Privacidade',
  purpose:
    'Como os seus dados pessoais são coletados, usados, compartilhados e protegidos.',

  versions: [
    {
      version: '1.0',
      effectiveDate: '30/09/2026',
      sections: [
        {
          id: 'introducao',
          heading: '1. Introdução',
          paragraphs: [
            'Esta Política de Privacidade explica como os seus dados pessoais são tratados quando você usa o Econva: o que é coletado, por que é usado, com quem é compartilhado, por quanto tempo é mantido e quais são os seus direitos.',
            'Ela se aplica a quem cria uma conta e a quem apenas consulta o aplicativo antes de se cadastrar.',
            'Este documento é publicado em versões. A versão vigente é sempre a que aparece aqui, e a que você aceita ao criar a conta. Quando uma nova versão é publicada, o aplicativo pede que você a reconheça — e o registro da versão que você aceitou antes é mantido, com a data daquele aceite.',
          ],
        },
        {
          id: 'controlador',
          heading: '2. Quem é responsável pelos seus dados',
          paragraphs: [
            'O responsável pelo tratamento dos seus dados é Giovani Taver Monari, pessoa física inscrita no CPF sob o nº 433.719.538-66.',
            'Canal para assuntos de privacidade: gitavermonari@outlook.com.',
            'Como não há encarregado pelo tratamento de dados pessoais (DPO) formalmente designado, os pedidos e dúvidas devem ser encaminhados diretamente ao canal de contato acima.',
          ],
        },
        {
          id: 'coleta',
          heading: '3. Quais dados pessoais o Econva coleta',
          paragraphs: [
            'A coleta é limitada ao que é necessário para operar o aplicativo. Nada é coletado para publicidade de terceiros, e nenhum dado pessoal é vendido.',
          ],
        },
        {
          id: 'cadastro',
          heading: '3.1 Dados coletados na criação da conta',
          paragraphs: [
            'Quando você cria uma conta, recebemos apenas:',
          ],
          items: [
            'E-mail — é o identificador da sua conta e o meio pelo qual nos comunicamos com você sobre o serviço.',
            'Senha — guardada de forma criptografada, por meio de um hash irreversível. A sua senha em texto nunca é armazenada nem pode ser recuperada por nós.',
            'Data e hora da criação da conta.',
            'Os registros de aceite dos documentos legais: qual versão dos Termos de Uso e qual versão da Política de Privacidade você aceitou, e quando.',
          ],
        },
        {
          id: 'uso-app',
          heading: '3.2 Dados que você registra no aplicativo',
          paragraphs: [
            'Para que o Econva funcione, você informa e o aplicativo gera:',
          ],
          items: [
            'Transações: valor, descrição, data, tipo e status.',
            'Categorias e gastos recorrentes que você cria.',
            'Metas financeiras, valores alvo e prazos.',
            'Renda mensal e demais informações de organização que você preencher.',
          ],
        },
        {
          id: 'open-finance-dados',
          heading: '3.3 Dados obtidos pelo Open Finance',
          paragraphs: [
            'Se você conectar uma instituição financeira, recebemos, por meio do Open Finance, apenas o que você autorizar naquele fluxo. Em geral isso inclui os itens abaixo. Esses dados vêm da sua instituição financeira, passam pelo prestador de infraestrutura de Open Finance e chegam ao Econva — nós não temos acesso às suas credenciais bancárias, que são digitadas na instituição e nunca no aplicativo.',
          ],
          items: [
            'Identificação da instituição e da conta (tipo, subtipo, nome).',
            'Saldos e limites.',
            'Movimentações: data, descrição, valor e natureza da transação.',
            'Identificadores técnicos da conexão, usados para manter a sincronização e permitir a revogação.',
          ],
        },
        {
          id: 'tecnicos',
          heading: '3.4 Dados técnicos e de segurança',
          paragraphs: [
            'Por razões de segurança e de operação, tratamos também:',
          ],
          items: [
            'Token de acesso da sua sessão, com prazo de validade limitado.',
            'Endereço IP e registros de acesso — usados para autenticar sessões, prevenir abuso, autenticação indevida e tentativas de força bruta, e atender a obrigações legais de guarda de registros de acesso.',
            'Registros operacionais de erro, necessários para diagnosticar falhas.',
          ],
        },
        {
          id: 'finalidades',
          heading: '4. Para que cada categoria é usada',
          paragraphs: [
            'Cada categoria de dado tem uma finalidade e uma base legal, conforme a Lei nº 13.709/2018 (LGPD):',
          ],
          items: [
            'E-mail, senha e registros de sessão — executar o contrato com você e permitir o acesso à conta (LGPD, art. 7º, V).',
            'Dados financeiros que você registra — executar o contrato: é para isso que o aplicativo existe (art. 7º, V).',
            'Dados obtidos pelo Open Finance — a sua autorização, dada no fluxo oficial do Open Finance, mais a execução do serviço que você solicitou.',
            'Endereço IP, registros de acesso e registros de erro — proteção e segurança do sistema e prevenção a fraudes, com base no legítimo interesse (art. 7º, IX) e nas obrigações legais (art. 7º, II).',
            'Registros de aceite dos documentos legais — demonstrar que você foi informado e aceitou as condições vigentes, com base no legítimo interesse e na demonstração do cumprimento de obrigações regulatórias (art. 7º, VI e IX).',
            'Comunicações transacionais, como lembretes de contas a vencer — executar o contrato (art. 7º, V).',
          ],
          closing: [
            'A Política de Privacidade não é um consentimento genérico para todas as finalidades acima. Quando a lei exigir consentimento para uma atividade específica, ele será solicitado separadamente, com informação clara sobre aquela atividade.',
          ],
        },
        {
          id: 'financeiros',
          heading: '5. Como os dados financeiros são tratados',
          paragraphs: [
            'Os dados financeiros existem para exibir a sua própria organização: a tela de transações, os gráficos de categoria, as metas e os relatórios do aplicativo.',
            'Eles não são usados para publicidade, não são vendidos e não são compartilhados com entidades de crédito, instituições financeiras ou anunciantes.',
            'O tratamento é feito de forma vinculada à sua conta: as informações são lidas e apresentadas no contexto do usuário autenticado, e nenhuma tela expõe dados de outra conta.',
            'Uma parte desses dados não vem de você, e sim da sua instituição financeira pelo Open Finance. Como ela é a fonte, eventuais atrasos ou divergências na origem podem aparecer no aplicativo.',
          ],
        },
        {
          id: 'open-finance-uso',
          heading: '6. Como os dados do Open Finance são usados',
          paragraphs: [
            'O objetivo é um só: sincronizar contas e movimentações para você não precisar lançar tudo à mão.',
            'As contas e transações sincronizadas passam a ser exibidas no aplicativo e podem ser usadas junto com os dados que você mesmo registra, nos mesmos gráficos e relatórios.',
            'A conexão pode ser encerrada por você a qualquer momento, na tela da conta bancária do aplicativo. A revogação interrompe a sincronização futura e apaga as contas e movimentações sincronizadas locally na sua conta do Econva.',
            'A revogação na sua instituição financeira ou pelos mecanismos do Open Finance também interrompe o compartilhamento. Os dois caminhos são independentes e qualquer um deles produz efeito.',
            'O Econva não é instituição financeira nem participante autorizado do Open Finance. A conexão é intermediada por um prestador de infraestrutura e autorizada por você dentro da instituição financeira.',
          ],
        },
        {
          id: 'terceiros',
          heading: '7. Compartilhamento e terceiros',
          paragraphs: [
            'Compartilhamos dados pessoais apenas com quem precisa deles para entregar o serviço, sob contrato e mediante as medidas de segurança descritas neste documento:',
          ],
          items: [
            'Pluggy — prestador de infraestrutura de Open Finance: participa da conexão com a sua instituição, do fluxo de autorização e da entrega das contas e movimentações.',
            'Railway — provedor de infraestrutura e hospedagem da API e do banco de dados, onde a aplicação e os seus dados são armazenados.',
            'Resend — serviço de envio de e-mails transacionais, usado para mensagens do próprio serviço, como lembretes de vencimento.',
            'Prestadores de infraestrutura de nuvem e rede contratados para operar a plataforma.',
          ],
          closing: [
            'Esses prestadores tratam dados em nosso nome, para a finalidade contratada, e não podem usá-los para finalidades próprias.',
            'Não vendemos dados pessoais e não os compartilhamos para publicidade de terceiros.',
            'Podemos compartilhar informação quando exigido por lei, ordem judicial ou autoridade competente, ou para proteger direitos, segurança e prevenção a fraude.',
            'Se algum prestador operar dados fora do Brasil, a transferência será feita respeitando estritamente as hipóteses e salvaguardas previstas pela LGPD.',
          ],
        },
        {
          id: 'retencao',
          heading: '8. Por quanto tempo os dados são mantidos',
          paragraphs: [
            'O prazo depende da finalidade e do que a lei exige:',
          ],
          items: [
            'Dados da conta e dados financeiros: enquanto a sua conta estiver ativa, porque são esses dados que compõem o serviço.',
            'Dados de conexão do Open Finance: enquanto a conexão existir, mais o tempo necessário para comprovar a autorização que você deu.',
            'Registros de aceite dos documentos legais: enquanto durarem as obrigações que aquele aceite demonstra, para que possamos provar qual versão você aceitou e quando.',
            'Registros de acesso e registros de segurança: pelo prazo exigido pela legislação aplicável, inclusive a Lei nº 12.965/2014 (Marco Civil da Internet).',
            'Após o encerramento da conta: mantemos apenas o que for necessário para cumprir obrigações legais, fiscais e regulatórias, e depois eliminamos ou anonimizamos o restante.',
          ],
          closing: [
            'Os prazos de retenção observam as exigências legais e regulatórias aplicáveis a cada categoria de dado.',
          ],
        },
        {
          id: 'seguranca',
          heading: '9. Medidas de segurança',
          paragraphs: [
            'Adotamos medidas técnicas e organizacionais proporcionais ao risco:',
          ],
          items: [
            'Comunicação criptografada em trânsito (HTTPS/TLS).',
            'Senhas armazenadas apenas como hash irreversível, com custo computacional elevado.',
            'Autenticação por token com prazo de validade, de forma que a sessão possa ser encerrada.',
            'Verificação de identidade no servidor: as operações são resolvidas a partir do token autenticado, e não a partir de informação enviada pelo aplicativo.',
            'Controle de tentativas de acesso repetidas, para reduzir risco de força bruta.',
            'Separação entre sessão, documentos legais e conexão financeira, de modo que uma não substitui nem afeta a outra.',
            'Acesso interno limitado às pessoas que precisam operar o serviço.',
          ],
          closing: [
            'Nenhum sistema é imune a incidentes. Não prometemos que os seus dados nunca serão expostos — o que fazemos é reduzir a probabilidade, limitar o impacto e agir conforme a legislação quando algo acontece, incluindo comunicação aos titulares e à ANPD quando a lei exigir.',
          ],
        },
        {
          id: 'direitos',
          heading: '10. Os seus direitos sob a LGPD',
          paragraphs: [
            'Nos termos da LGPD, você pode solicitar:',
          ],
          items: [
            'Confirmação da existência de tratamento dos seus dados.',
            'Acesso aos dados que tratamos sobre você.',
            'Correção de dados incompletos, inexatos ou desatualizados.',
            'Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade.',
            'Portabilidade dos dados a outro prestador de serviço, mediante regulamentação da ANPD.',
            'Informação sobre com quem compartilhamos os seus dados e a possibilidade de não dar consentimento.',
            'Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa.',
            'Revogação do consentimento, quando este for a base legal aplicável.',
            'Oposição a tratamento realizado com fundamento em hipótese de dispensa de consentimento, quando houver inconformidade.',
          ],
        },
        {
          id: 'exercer-direitos',
          heading: '11. Como exercer esses direitos',
          paragraphs: [
            'Envie o seu pedido pelo canal gitavermonari@outlook.com, informando o e-mail da sua conta e o direito que deseja exercer.',
            'Para proteger você, poderemos pedir confirmação de identidade antes de responder. Pedidos de terceiros em nome de um titular não serão atendidos sem base legal para isso.',
            'Responderemos dentro dos prazos previstos em lei. Alguns pedidos podem ter fundamento legal para serem recusados — nesse caso, explicamos o motivo.',
            'Os pedidos para exercício de direitos devem ser encaminhados ao e-mail informado acima.',
          ],
        },
        {
          id: 'consentimento',
          heading: '12. Quando o consentimento é a base legal',
          paragraphs: [
            'Em algumas situações, o tratamento depende do seu consentimento livre, informado e específico.',
            'Onde isso acontece, o consentimento é pedido para uma finalidade determinada — não de forma agregada — e você pode recusá-lo sem perder o acesso ao restante do serviço.',
            'Você pode revogar esse consentimento a qualquer momento, de forma facilitada e gratuita, pelo canal indicado na seção 11 ou pelos mecanismos de revogação disponíveis no próprio aplicativo.',
            'A revogação não afeta a legitimidade do tratamento feito antes dela.',
            'A conexão bancária pelo Open Finance é um caso específico: o compartilhamento acontece mediante a autorização que você dá no fluxo oficial da instituição, e a revogação pode ser feita tanto pelos mecanismos do Open Finance quanto pela tela de conta bancária do Econva.',
          ],
        },
        {
          id: 'menores',
          heading: '13. Menores de idade',
          paragraphs: [
            'O Econva não é destinado a menores de idade. Se tomarmos conhecimento de um cadastro feito por menor, tomaremos as medidas razoáveis para eliminá-lo.',
          ],
        },
        {
          id: 'alteracoes',
          heading: '14. Alterações desta Política',
          paragraphs: [
            'Esta Política pode ser alterada. A versão vigente é sempre a publicada aqui, identificada pelo seu número e pela sua data de vigência.',
            'Quando uma nova versão for publicada, o aplicativo informa você e pede o reconhecimento antes de continuar. O registro da versão anterior que você aceitou é preservado, com a data daquele aceite — nada é sobrescrito.',
            'Consulte a versão vigente em Política de Privacidade, dentro do seu perfil, ou na tela de boas-vindas.',
          ],
        },
        {
          id: 'contato',
          heading: '15. Contato',
          paragraphs: [
            'Dúvidas, pedidos e reclamações sobre privacidade podem ser enviados para gitavermonari@outlook.com.',
          ],
        },
      ],
    },
  ],
};
