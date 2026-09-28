# Sala — operação, segurança e próximos bloqueios

## Implementado nesta entrega

- Menu por participante: voz, áudio da tela, mudo local, câmera oculta, assistir à tela, denúncia, restaurar ajustes.
- Renomear: somente anfitrião; atualização pelo polling, convite preservado.
- Gravação local de uma tela e seu áudio, com aviso de gravação na presença. Até 30 minutos/512 MiB por trecho, três vídeos temporários antes de remoção; não há gravação contínua central. Baixar antes de fechar. A saída usa o formato suportado pelo MediaRecorder.
- Métricas agregadas por minuto de pedidos HTTP, falhas, bytes de saída e tempo do handler. Não incluem WebRTC peer-to-peer, tráfego total do TURN, custos de fornecedor nem qualidade audível.
- Auditoria de criação/entrada/saída, envio de chat/anexo, denúncias e ações administrativas; sem tokens, conteúdo de conversas ou IP bruto. Polling é contabilizado em métricas, não duplicado como evento de conteúdo.
- Denúncias autenticadas pela sessão, limitadas por participante, revisão com justificativa e suspensão da sessão/encerramento de sala.
- Administração em /admin: autenticação ChatGPT da plataforma + allowlist server-side. Ausência de allowlist sempre nega acesso. O aplicativo público permanece público. Use o painel no navegador.
- Integração opcional real de moderação de TEXTO via API do provedor, antes de inserir no chat. Classificações não são prova de crime. Erro/time-out não libera mensagem quando a integração está ativa.

## Configuração pendente (não colocar segredos no GitHub)

- SALA_ADMIN_EMAILS: e-mails autenticados dos administradores separados por vírgula; confirmar o e-mail do responsável. Nunca autorizar pelo nome exibido ou por parâmetro enviado pelo cliente.
- SALA_MODERATION_API_KEY: credencial da OpenAI API armazenada somente no ambiente servidor. Sem essa variável, não há IA moderando. Não pedir a chave em mensagem pública; configurá-la pelo gerenciador de segredos.
- SALA_MODERATION_REQUIRED=true: bloqueia texto sem serviço configurado e bloqueia anexos, pois revisão de imagens/GIFs ainda não foi integrada. Por padrão não é ativado para não fingir cobertura ou interromper o serviço existente sem preparação.
- SALA_PRIVACY_EMAIL: contato a preencher junto à versão definitiva dos termos.

## Limites e mudança arquitetural necessária

A arquitetura atual usa malha WebRTC. TURN retransmite pacotes criptografados, não entrega conteúdo analisável ao moderador. Um bot no cliente pode ser desativado por cliente adulterado e não é um mecanismo confiável de fiscalização.

Para moderação de mídia antes de entrega: contratar/configurar SFU e processamento de mídia do lado servidor; emitir tokens curtos atrelados a conta/sala; impedir conexões diretas fora desse caminho; receber eventos autenticados; processar áudio em segmentos e transcrição, amostrar vídeo e inspecionar anexos/GIFs completos; definir buffer e latência aceitáveis. SFU comum com repasse imediato também não garante bloquear antes de alguém ver. Bloqueio deve ocorrer no servidor de mídia, com suspensão de publicação, atualização para os receptores, alerta ao moderador e revisão. Não prometer latência zero nem detecção de todo ilícito.

Uma coordenação central de regras recebe sinais especializados de texto, mídia, reputação de links e denúncias. Serviços devem emitir decisões estruturadas e justificadas, sem autonomia para determinar crime ou denunciar pessoas automaticamente às autoridades. Conteúdo do usuário é dado não confiável, nunca instrução para agentes/tools. Revisão humana e recurso são necessários. Links não são acessados pelo backend atual, evitando SSRF; ainda não há consulta de reputação nem inspeção do site de destino.

Material conhecido ou suspeito de abuso sexual infantil não deve ser enviado a APIs genéricas de moderação. É necessária integração com serviço especializado e procedimento jurídico de preservação/reporte, acesso estrito e equipe treinada. Não construir coleção indiscriminada de evidências ilícitas nem mostrar imagens potencialmente ilegais no painel.

## Identidade e proteção contra reincidência

Recomenda-se login obrigatório antes de publicar/transmitir/entrar em sala na versão pública definitiva, com e-mail verificado, recuperação de conta, limitação de tentativas, revogação e exclusão. Para administração, exigir MFA no provedor e perfis de privilégio mínimo. Login não comprova identidade civil nem impede crime por si só.

Login dos participantes não foi imposto nesta entrega. A escolha/configuração de um provedor público e integração com o instalador ainda depende da decisão do operador. Suspender sessão anônima é contornável ao criar outra sessão; não chamar isso de banimento de pessoa. Contas, sanções globais, aceite versionado e recursos dependem dessa identidade persistente.

## Retenção, logs legais e LGPD

Janela operacional: 30 dias para auditoria/métricas; 90 dias da criação para denúncias revisadas; abertas permanecem até revisão. A rotina de limpeza em /api/admin (ação retention) exige administrador e justificativa; ainda precisa de agendamento e alertas de falha. Antes de apagar dados sob ordem de preservação, suspender a rotina e cumprir o procedimento legal. Legal hold granular, exportação controlada, retenção legal de acesso e política de backups NÃO estão implementados.

Não guardar todos os áudios/vídeos por padrão. Não confundir conteúdo de comunicação com logs de acesso. O enquadramento no art. 15 do Marco Civil, guarda de registros por seis meses, forma de identificar IP/data/hora, proteção criptográfica, autoridade para acesso e descarte exigem validação jurídica e infraestrutura apropriada. A auditoria atual não satisfaz sozinha esses deveres.

## Gates antes de chamar o backend de pronto para produção

1. Confirmar operador legal, suporte/privacidade, administradores e política de idade.
2. Configurar identidade persistente e MFA para equipe; testar autorização de todas as rotas e ambiente de identidade da plataforma em produção.
3. Escolher SFU, análise de mídia/anexos, reputação de links, fila durável e orçamento. Provisionar credenciais e webhooks verificados.
4. Configurar alertas de disponibilidade, fila atrasada, excesso de gastos/TURN, falha na auditoria, backups e restauração ensaiada.
5. Política de incidentes, ordens legais, preservação, exclusão e revisão humana com prazos e responsáveis.
6. Testar 15 usuários reais, múltiplas salas, redes móveis/NAT, reconexão, latência de moderação e recuperação. Fazer revisão de segurança independente antes de crescimento público.

Não há certificação de conformidade, moderação audiovisual ativa nem garantia de impedir crimes nesta entrega.
