# Sala — Voz e tela

Aplicativo inicial em português para conversa em grupo ou apresentação. Até 15 participantes no total; salas expiram em 12 horas. O anfitrião encerra a sala para todos ao clicar em Encerrar sala. Fechar a janela sem encerrar mantém a sala até expirar. Instalação no Windows por PWA no Chrome/Edge; não inclui instalador nativo EXE.

## Implementação
Vinext/React, Worker e D1. Sinalização por polling a cada 1,5 segundo. WebRTC em malha com quatro transceptores: microfone, vídeo da tela, áudio da tela e câmera. Microfone começa desligado; captura de tela depende de ação e permissão do usuário. Sem gravação. O navegador determina quais fontes de áudio da tela pode compartilhar.

Convite com identificador aleatório de 128 bits na URL. Cada participante recebe token de sessão separado. API verifica sessão, origem, capacidade e permissões da plateia. Sem autenticação individual ou expulsão. O controle de acesso da hospedagem continua aplicável: publicação privada não libera convidados externos.

## Limites
- STUN configurado, sem TURN. Redes restritivas e NATs incompatíveis podem impedir mídia mesmo quando a sala carrega.
- O limite de 15 não é uma medição de capacidade. Qualidade depende do upload, computador e quantidade de telas.
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

## Correção de mídia — 25/09/2026

Apenas o iniciador cria os quatro transceivers; quem responde adota os m-lines
recebidos antes de associar microfone, tela, áudio da tela e câmera. Cada faixa de
áudio remoto tem um elemento de reprodução independente. O botão Reconectar
reinicia a negociação com os participantes. A presença tolera 3 minutos sem poll,
e o token pode retomar a sessão dentro da validade da sala se houver vaga.

### TURN pendente de provisionamento

O ambiente ainda NÃO possui serviço TURN. Conexões diretas podem falhar em redes
móveis, NAT restritivo e firewalls. Configure no ambiente do Site `TURN_URLS`
(lista separada por vírgulas, incluindo TURN TCP/TLS 443 quando disponível) e
`TURN_SHARED_SECRET` como segredo, usando um serviço compatível com TURN REST
HMAC-SHA1 (por exemplo coturn com use-auth-secret). O endpoint autenticado `ice`
entrega credenciais temporárias válidas por 12h, nunca o segredo compartilhado.
Não usar chave de API de um provedor no lugar desse segredo. Novas salas usam a
configuração. A integração está preparada; não há relay provisionado nem validado.

No celular, recepção de tela, áudio e câmera dependem do navegador e permissões.
Transmitir a própria tela depende de getDisplayMedia; onde indisponível, é
necessário desenvolver captura nativa (não resolvido pela instalação PWA).

Validação desta correção: testes de API/permissões/retomada/capacidade e áudio
local; compilação TypeScript. O ensaio WebRTC com mídia sintética no navegador de
teste negociou 4 transceivers, mas não estabeleceu ICE nem recebeu mídia. Portanto,
áudio/vídeo real entre dispositivos e redes diferentes ainda não foi validado.

### Ativação com Metered/Open Relay

A integração também aceita `METERED_APP_HOST` (somente o hostname atribuído pelo
painel, ex. seu-app.metered.live) e `METERED_TURN_API_KEY` (segredo). A chave de API
é utilizada apenas no Worker para obter os iceServers; não é entregue ao cliente.
O endpoint valida a resposta e exige pelo menos um servidor TURN. Não há fallback
silencioso para STUN quando a configuração do provedor estiver inválida.

Para concluir: o titular cria/acessa a conta em https://dashboard.metered.ca,
obtém o hostname e a chave TURN, configura os dois valores no ambiente do Site e
publica a versão para aplicar o ambiente. Nenhuma conta foi criada e nenhum plano
foi contratado nesta implementação. Não compartilhar chaves em repositórios.
Depois de ativar, validar chamadas reais entre duas redes, incluindo Wi-Fi/4G,
áudio nos dois sentidos, tela e câmera, e conferir a franquia no painel do provedor.
Até isso ocorrer, o programa não deve ser descrito como completamente validado.

## Filtro e diagnóstico — revisão de 25/09/2026 à tarde

- Mantém a supressão nativa e adiciona passa-altas de 85 Hz quando a redução de
  ruído está ativada. Um AudioWorklet atenua em ~28 dB sons abaixo do limite nas
  pausas, com ataque de 3 ms, hold de 150 ms e release de 180 ms. O limite padrão
  é conservador (-50 dB), regulável de -70 a -25 dB. Não é separação por IA e
  ruídos fortes ou sobrepostos à fala podem continuar audíveis.
- O worklet funciona fora dos timers da página. Quando não suportado, mantém
  captura e filtros nativos, mostra aviso e não bloqueia a chamada.
- Reprodução recebida usa elementos de áudio individuais, tenta tocar quando a
  faixa deixa de estar muda e mantém um botão explícito Ouvir sala.
- Verificar áudio mede os bytes de áudio enviados/recebidos em 1 segundo, o
  estado do microfone, volume, modo da sala e uso de TURN. Tráfego não comprova
  voz audível. O diagnóstico não envia nomes nem estatísticas para terceiros.
- Reconectar atualiza as credenciais ICE antes de reiniciar a negociação. A opção
  Reconectar pelo servidor força o caminho TURN apenas quando configurado.
- O TURN Metered foi ativado em produção com ambiente protegido, em teste de
  500 MB conforme o painel observado. A antiga nota 'não configurado' descreve
  o estado anterior. Não foi contratado plano pago. Validação entre os aparelhos
  reais ainda depende de teste de áudio pelos participantes.

## Capacidade de sala

Limite de 15 pessoas no total (anfitrião + 14 convidados), em conversa e
apresentação. Entrada e retomada respeitam o mesmo limite. O teste de API
verifica a 15ª entrada, recusa da 16ª e reposição de vaga. Isso valida a
capacidade de entrada, não desempenho de mídia: a arquitetura continua em malha
WebRTC, com até 14 conexões por participante em conversa. Áudio/vídeo com 15
aparelhos simultâneos ainda precisa de validação; múltiplas câmeras e telas
aumentam bastante o uso de rede e processamento.
