# Sala — Voz e tela

Aplicativo inicial em português para conversa em grupo ou apresentação. Até seis participantes no total; salas expiram em 12 horas. O anfitrião encerra a sala para todos ao clicar em Encerrar sala. Fechar a janela sem encerrar mantém a sala até expirar. Instalação no Windows por PWA no Chrome/Edge; não inclui instalador nativo EXE.

## Implementação
Vinext/React, Worker e D1. Sinalização por polling a cada 1,5 segundo. WebRTC em malha com quatro transceptores: microfone, vídeo da tela, áudio da tela e câmera. Microfone começa desligado; captura de tela depende de ação e permissão do usuário. Sem gravação. O navegador determina quais fontes de áudio da tela pode compartilhar.

Convite com identificador aleatório de 128 bits na URL. Cada participante recebe token de sessão separado. API verifica sessão, origem, capacidade e permissões da plateia. Sem autenticação individual ou expulsão. O controle de acesso da hospedagem continua aplicável: publicação privada não libera convidados externos.

## Limites
- STUN configurado, sem TURN. Redes restritivas e NATs incompatíveis podem impedir mídia mesmo quando a sala carrega.
- O limite de seis não é uma medição de capacidade. Qualidade depende do upload, computador e quantidade de telas.
- Sem SFU, grandes plateias, gravação ou chat.
- Uma aba suspensa pode expirar após 60 segundos; reabra a sala.
- Atualizar a página exige nova entrada; o participante antigo desaparece após 45 segundos.
- Metadados e sinais no D1. Sinais com mais de dois minutos são removidos durante polling. Salas expiradas são removidas na próxima criação.

## Verificação
`node tests/room.test.mjs` testa API com SQLite: criação, convite, permissões, autenticação, origem, entrega de sinais e cursor, capacidade, encerramento e remoção em cascata.
`node node_modules/typescript/bin/tsc --noEmit` valida tipos.

Testado no navegador: criação e entrada de um segundo participante. Microfone físico, captura de tela, interoperabilidade de redes e instalação no Windows ainda precisam de teste em dispositivos reais. WebMCP não estava disponível no ambiente de QA; integração opcional e somente de leitura.

## Configurações de dispositivos
Painel disponível antes e durante a chamada: entrada de microfone, ganho de 0–200%, redução de ruído, cancelamento de eco, ganho automático, medidor de pico, retorno local com volume próprio, câmera/resolução/prévia espelhada, saída de áudio e tom de teste. Preferências guardadas somente no navegador. O retorno começa desligado, nunca é salvo como ligado e para ao fechar o painel. A câmera de teste não é transmitida até o botão Ligar câmera ser acionado na sala. Fechar o painel mantém apenas microfone/câmera que já estavam em transmissão. A plateia não transmite câmera ou microfone.

O microfone passa por um GainNode e dois destinos distintos: saída para a chamada e retorno local. Silenciar a chamada não bloqueia o teste local. A saída selecionada usa setSinkId quando disponível; quando não há suporte, a interface informa que o sistema controla a saída. Filtros e resolução dependem do navegador/hardware.

`node tests/audio.test.mjs` verifica isolamento de monitoramento e mudo, liberação das capturas e contexto, limites de ganho/volume, roteamento de saída e validação de preferências com objetos de teste. Não substitui teste em dispositivos reais.
