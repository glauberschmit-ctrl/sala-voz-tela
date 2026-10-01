# Salas permanentes, calls e amigos

- Contas cadastradas podem criar até 10 salas permanentes. O convite continua válido depois que o dono sai. O responsável pode voltar pela lista de servidores da conta e encerrar a sala com confirmação; encerrar remove histórico, GIFs e subsalas. Contas com salas próprias precisam encerrá-las antes de excluir a conta.
- Visitantes continuam entrando pelo convite, sem login. Amigos e criação de salas permanentes exigem conta cadastrada, com validação no servidor.
- Até 12 subsalas além de Geral. O limite atual continua sendo 15 participantes simultâneos por sala inteira. Áudio, câmera, telas e sinalização ficam isolados por call; o chat é compartilhado. Trocar desliga microfone, câmera e compartilhamento. Pare uma gravação antes de trocar.
- Amigos: código aleatório de 16 caracteres, pedidos pendentes, aceite exclusivo pelo destinatário, cancelamento, recusa e remoção. Não há mensagens privadas nem importação de contatos.
- Sala Bot: comandos /ajuda, /regras, /sala e /dado executados no backend, com limite do chat e resposta idempotente. É um bot nativo determinístico, não IA e não uma plataforma compatível com bots externos do Discord. Não escuta chamadas. A moderação textual existente continua ativa. Nenhuma API paga foi adicionada; a infraestrutura permanece sujeita às suas cotas.
- Referências da arquitetura de comandos: https://docs.discord.com/developers/docs/interactions/slash-commands e https://docs.discord.com/developers/topics/oauth2. A implementação não usa tokens nem serviços do Discord.
- Envio de arquivo removido da interface; GIFs continuam selecionados pelo catálogo KLIPY. Arquivos existentes no histórico continuam legíveis. A rota interna de mídia permanece para o envio dos GIFs.
- Tela cheia funciona pela API Fullscreen quando suportada pelo navegador. Controles ficam dentro da tela e independentes da navegação lateral.

Validação: testes SQLite reais com todas as migrações para propriedade, sessão, isolamento, limpeza e amizades; TypeScript e build. Não substituem um teste com duas pessoas em redes distintas. Nesta rodada não havia a skill de navegador exigida pelo preview, portanto não foi possível fazer a conferência visual automatizada.
