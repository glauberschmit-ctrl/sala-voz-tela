# Autenticação do Sala

O Sala usa Firebase Authentication (projeto sala-2f9c7) com Google e e-mail/senha. O acesso a salas continua opcional para convidados. A configuração web é pública; nenhuma chave de conta de serviço é usada.

- O SDK autentica diretamente no Firebase. Senhas não passam pelas APIs do Sala.
- O servidor verifica RS256 com certificados públicos do Firebase, emissor, projeto, validade, subject e autenticação. Nunca confia em um e-mail fornecido no formulário para identificar a conta.
- O token validado fica em cookie HttpOnly, Secure, SameSite=None e Partitioned em HTTPS (SameSite=Lax somente na prévia HTTP), limitado à validade do ID token (normalmente até uma hora). Uma consulta GET confirma que o cookie retornou ao servidor antes de navegar. A recuperação automática limita recarregamentos por identidade para evitar ciclos. O cliente renova o token periodicamente e ao retomar a janela. Alterações na sessão exigem Origin do mesmo site.
- Perfil e sessões de sala usam o identificador firebase:<uid>. Contas antigas ChatGPT não são vinculadas automaticamente por e-mail. Salas antigas vinculadas a essas contas exigem nova entrada pelo convite; salas de convidados permanecem independentes.
- Administradores precisam do e-mail na lista SALA_ADMIN_EMAILS e email_verified verdadeiro.
- A recuperação e a confirmação de e-mail usam os modelos do Firebase. Verificar envio, recebimento e spam com uma conta real após publicação.
- O aplicativo Electron atual bloqueia pop-ups externos: Google está disponível no navegador, e-mail/senha no aplicativo. Não foi alterado o instalador nesta versão.
- Verificação de ID token não consulta revogação a cada requisição: um token já emitido pode continuar válido até expirar. Para bloqueio imediato global por conta, é necessária uma camada adicional de revogação/consulta ao provedor.

## Configuração confirmada
Google e E-mail/senha habilitados pelo responsável. A API de configuração do Firebase confirmou sala-voz-glauber.glauberschmit.chatgpt.site na lista de domínios autorizados. Firebase Hosting não é necessário para hospedar o Sala; o domínio firebaseapp.com atende ao fluxo do provedor.

## Verificação
Executar node tests/firebase-auth.test.mjs, node tests/operations.test.mjs e node tests/room.test.mjs. O primeiro usa certificados e tokens locais de teste, sem criar usuários no projeto real. Testes cobrem assinatura, emissor, projeto, expiração, claims, administração com e-mail verificado, isolamento de perfis e acesso de convidados. O login interativo com uma conta real e a entrega dos e-mails exigem verificação pelo responsável.
