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

## Instalador web 0.1.2

Baixe `Sala-Web-Setup-0.1.2.exe` em https://github.com/glauberschmit-ctrl/sala-voz-tela/releases/tag/v0.1.2 . Esse executável pequeno baixa o pacote completo durante a instalação. Precisa de internet e continua sem assinatura digital; não contorna o Controle Inteligente de Aplicativos.

`npm run dist:web` gera o bootstrapper e o pacote `.7z`. Ambos são publicados na mesma release, com endereço específico da versão. O instalador NSIS verifica o hash do pacote baixado. Nunca substitua o pacote de uma versão publicada: aumente a versão e o endereço de publicação juntos.

O workflow testa o download público do instalador e a instalação silenciosa em uma máquina Windows temporária, sem pacote local ao lado do instalador. Isso não testa chamadas, captura do CS2 ou aceitação pelo Smart App Control.

A versão 0.1.2 grava o ícone e os metadados no executável, mantendo apenas a assinatura digital desativada. O teste Windows verifica a identidade visual do ícone extraído do executável instalado e o nome do produto. Instale sobre a versão anterior com o Sala fechado.
