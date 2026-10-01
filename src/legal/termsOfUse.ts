/**
 * Econva — Termos de Uso
 *
 * The single source of this document. Nothing else in the app contains legal
 * text or a version number, so revising it happens here alone.
 *
 * Everything the project does not know yet is written between square brackets
 * and stays visible: `[CNPJ]`, `[ENDEREÇO]`, `[E-MAIL DE CONTATO]`. They are
 * not decorative — the document screen lists every pending field, and the
 * registration flow will not treat a document as readable while those fields
 * are the only thing missing. Filling them in is a decision for the project
 * owner and its legal counsel, not for the app.
 *
 * To publish a new version: unshift an entry into `versions` with a higher
 * `version`, move the text across, and leave the previous entry untouched so
 * anyone who accepted version 1.0 can still read exactly what they accepted.
 */

import type { LegalDocument } from './types';

export const termsOfUse: LegalDocument = {
  key: 'terms',
  title: 'Termos de Uso',
  purpose:
    'As regras e as condições para utilizar o Econva.',

  // Newest first. `versions[0]` is the version a new account accepts.
  versions: [
    {
      version: '1.0',
      effectiveDate: '30/09/2026',
      sections: [
        {
          id: 'identificacao',
          heading: '1. Quem oferece este aplicativo',
          paragraphs: [
            'O Econva é um aplicativo de organização de finanças pessoais operado por Giovani Taver Monari, pessoa física inscrita no CPF sob o nº 433.719.538-66.',
            'Fale conosco pelo canal gitavermonari@outlook.com.',
          ],
        },
        {
          id: 'objeto',
          heading: '2. O que é o Econva',
          paragraphs: [
            'O Econva reúne em um só lugar as informações que você registra sobre a sua vida financeira: transações, categorias, gastos recorrentes e metas. Opcionalmente, ele também sincroniza contas e movimentações de instituições financeiras por meio do Open Finance.',
            'Ao criar uma conta ou continuar utilizando o aplicativo, você declara ter lido e concordado com estes Termos e com a Política de Privacidade. Se não concordar com algum deles, não utilize o aplicativo.',
          ],
        },
        {
          id: 'elegibilidade',
          heading: '3. Sua conta',
          items: [
            'Para utilizar o Econva você precisa ter capacidade civil plena, nos termos da legislação aplicável.',
            'A conta é pessoal e intransferível. Criar ou utilizar uma conta em nome de outra pessoa sem autorização não é permitido.',
            'O seu e-mail e a sua senha identificam você no serviço. Manter a senha em sigilo é de sua responsabilidade: qualquer acesso feito com as suas credenciais será tratado como seu.',
            'Você se compromete a nos informar imediatamente se suspeitar que alguém acessou a sua conta.',
          ],
        },
        {
          id: 'natureza',
          heading: '4. O que o Econva não é',
          paragraphs: [
            'É importante que fique claro o limite do serviço antes de você confiar nele:',
          ],
          items: [
            'O Econva não é uma instituição financeira e não está autorizado pelo Banco Central do Brasil a integrar o Open Finance.',
            'O Econva não guarda dinheiro, não custodia ativos, não realiza pagamentos, transferências, investimentos, empréstimos ou cobranças.',
            'O Econva não presta assessoria, consultoria ou recomendação de investimento, e não recomenda onde guardar ou aplicar o seu dinheiro.',
            'O Econva é uma ferramenta de organização: ele apresenta informações, e a decisão sobre o que fazer com elas é sempre sua.',
            'As exibições dependem dos dados que você registra ou que a sua instituição financeira devolve pelo Open Finance. Erros na origem podem aparecer aqui.',
          ],
        },
        {
          id: 'open-finance',
          heading: '5. Conexão bancária pelo Open Finance',
          paragraphs: [
            'A conexão com a sua instituição financeira acontece no fluxo oficial do Open Finance, dentro da própria instituição. Você é redirecionado até ela para se autenticar e autorizar o compartilhamento.',
            'Você nunca digita a sua senha bancária no Econva, e nós nunca pedimos essa senha.',
            'A autorização é dada somente para as informações que você escolher, e pode ser revogada a qualquer momento pelos mecanismos disponíveis no Open Finance e pelo próprio aplicativo.',
            'O Econva atua como usuário dessa informação, e a conexão é intermediada por um prestador de infraestrutura de Open Finance. A Política de Privacidade explica quais dados chegam até nós e por quanto tempo são mantidos.',
          ],
        },
        {
          id: 'conduta',
          heading: '6. Como você pode usar o aplicativo',
          paragraphs: ['Não é permitido:'],
          items: [
            'Utilizar o Econva para fins ilícitos, fraudulentos ou que prejudiquem terceiros.',
            'Tentar acessar contas, dados ou áreas do aplicativo a que você não tem direito.',
            'Interferir no funcionamento do serviço, inclusive por meio de automações, varreduras ou tentativas repetidas de acesso.',
            'Reproduzir, revender ou explorar comercialmente o aplicativo ou seu conteúdo sem autorização.',
            'Registrar dados de terceiros sem uma base legal para fazer isso.',
            'Ocultar ou manipular a origem dos dados exibidos pelo aplicativo.',
          ],
        },
        {
          id: 'propriedade',
          heading: '7. Propriedade intelectual',
          paragraphs: [
            'A marca Econva, o seu desenho, o código e o conteúdo do aplicativo pertencem ao responsável pelo projeto ou a quem tenha lhe licenciado.',
            'Você recebe uma licença limitada, revogável, não exclusiva e intransferível para usar o Econva pessoalmente, enquanto sua conta existir. Essa licença não transfere nenhum direito de propriedade.',
          ],
        },
        {
          id: 'dados',
          heading: '8. Dados pessoais',
          paragraphs: [
            'O tratamento dos seus dados pessoais é descrito na Política de Privacidade, que integra a sua relação com o Econva.',
            'A aceitação da Política de Privacidade é o reconhecimento de ter sido informado sobre o tratamento dos seus dados. Quando uma atividade específica exigir consentimento — como a conexão bancária pelo Open Finance — esse consentimento é pedido separadamente, no momento da conexão.',
          ],
        },
        {
          id: 'disponibilidade',
          heading: '9. Disponibilidade',
          paragraphs: [
            'Trabalhamos para manter o aplicativo funcionando, mas não podemos prometer disponibilidade ininterrupta: há manutenções, falhas de rede e indisponibilidades de terceiros.',
            'Durante uma indisponibilidade, informações registradas em um dispositivo podem não estar atualizadas em outro.',
            'Podemos interromper, suspender ou descontinuar funcionalidades, avisando sempre que possível.',
          ],
        },
        {
          id: 'responsabilidade',
          heading: '10. Responsabilidade',
          paragraphs: [
            'Você é responsável pelos dados que registra no aplicativo e pela veracidade deles.',
            'Nas hipóteses permitidas em lei, o responsável pelo Econva não responde por decisões tomadas com base nas informações exibidas, nem por investimentos, pagamentos ou contratos realizados fora do aplicativo.',
            'Quando a origem de uma informação é a sua instituição financeira, o Econva não controla essa origem e não garante a exatidão do que ela devolve.',
            'A responsabilidade do Econva limita-se aos termos e condições expressamente estabelecidos neste documento e na legislação brasileira aplicável.',
          ],
        },
        {
          id: 'suspensao',
          heading: '11. Suspensão e encerramento',
          paragraphs: [
            'Você pode encerrar a sua conta a qualquer momento e pedir a exclusão dos seus dados, pelos canais indicados na Política de Privacidade.',
            'Podemos suspender ou encerrar contas que violem estes Termos, que representem risco de segurança ou que sejam usados de forma fraudulenta, avisando sempre que a situação permitir.',
            'Após o encerramento, os dados são mantidos apenas pelo tempo necessário para cumprir obrigações legais e regulatórias, conforme descrito na Política de Privacidade.',
          ],
        },
        {
          id: 'alteracoes',
          heading: '12. Alterações destes Termos',
          paragraphs: [
            'Estes Termos podem ser alterados. Quando uma nova versão for publicada, ela passa a ser a vigente e a versão anterior deixa de reger novos usos.',
            'O aplicativo identifica quando a versão vigente é diferente da que você aceitou e pede que você a reconheça antes de continuar. Nenhuma aceitação antiga é sobrescrita: cada versão aceita fica registrada com a data em que você a aceitou.',
            'A versão vigente e o histórico ficam disponíveis em Termos de Uso, dentro do seu perfil, e também antes de você criar uma conta.',
          ],
        },
        {
          id: 'legislacao',
          heading: '13. Legislação aplicável e foro',
          paragraphs: [
            'Estes Termos são regidos pelas leis da República Federativa do Brasil.',
            'Fica eleito o foro do domicílio do usuário para dirimir eventuais controvérsias, conforme legislação aplicável ao consumidor.',
          ],
        },
        {
          id: 'contato',
          heading: '14. Contato',
          paragraphs: [
            'Dúvidas sobre estes Termos podem ser enviadas para gitavermonari@outlook.com.',
            'Pedidos relacionados a dados pessoais devem seguir os canais indicados na Política de Privacidade.',
          ],
        },
      ],
    },
  ],
};
