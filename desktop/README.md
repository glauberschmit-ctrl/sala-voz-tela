# Sala para Windows — versão inicial

Aplicativo Electron que abre o serviço Sala publicado. Compartilha as mesmas salas de até 15 participantes do navegador. Precisa de internet; não hospeda o servidor localmente.

## Instalação e uso

1. Execute `Sala-Setup-0.1.0.exe` no Windows 10/11 de 64 bits.
2. Abra Sala pelo atalho e crie uma sala ou cole o convite em Entrar.
3. Ative o microfone na sala e confira os dispositivos em Configurações.
4. Ao compartilhar, selecione uma tela ou janela. O áudio do computador é opcional e inclui todos os sons, não apenas o jogo.
5. Para CS2 com imagem preta, experimente janela sem bordas e captura da tela.

O menu Sala → Abrir convite copiado lê o convite da área de transferência somente ao clicar nessa opção. Abrir um convite pode encerrar a chamada atual. Fechar o aplicativo encerra a chamada; minimizar mantém a janela em segundo plano.

Esta versão não tem assinatura digital nem atualização automática do executável. As atualizações do site aparecem ao recarregar. O instalador pode exibir aviso de editor desconhecido. Nenhum certificado ou plano pago foi contratado.

## Desenvolvimento

```sh
cd desktop
npm ci
npm test
npm start
npm run dist:win
```

O instalador fica em `desktop/release`. O workflow `.github/workflows/windows-installer.yml` também gera o instalador em Windows e disponibiliza o artefato `Sala-Windows` no GitHub Actions.

## Segurança e validação

Conteúdo remoto sem Node.js, com sandbox e isolamento de contexto. Permissões limitadas à origem HTTPS exata do Sala. A captura exige uma ação do usuário e seleção explícita em janela local. Links externos e novas janelas são bloqueados.

Testes automatizados validam a política de origem e permissões. A instalação e chamadas reais no Windows, incluindo CS2, ainda precisam ser testadas. Empacotar como aplicativo não resolve por si só problemas de WebRTC, conectividade TURN ou capacidade da rede. A qualidade com 15 pessoas não foi validada.

APIs oficiais: https://www.electronjs.org/docs/latest/api/desktop-capturer e https://www.electronjs.org/docs/latest/api/session
