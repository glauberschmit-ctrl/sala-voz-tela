# Catálogo KLIPY

Criar a chave própria no painel https://partner.klipy.com e configurar KLIPY_API_KEY como segredo do serviço. Sem chave, o catálogo informa a indisponibilidade ; GIFs são selecionados somente no catálogo pela interface. Não usar chaves de demonstração de terceiros. A chave de teste possui limite documentado de 100 consultas/hora; produção depende da aprovação e condições do provedor. Não há contratação automática.

Usa API v2 compatível, filtro high, busca manual para evitar consultas por tecla, cache de resultados apenas no painel aberto, 20 operações por minuto por participante. Apenas membros autenticados na sala consultam o proxy. O servidor não envia nomes, tokens, e-mails ou mensagens ao catálogo; envia a consulta, idioma e país. As prévias são carregadas do CDN KLIPY e expõem o IP do visitante ao provedor. Downloads aceitam apenas HTTPS static.klipy.com, sem redirecionamentos, até 5 MB e assinatura GIF.

A seleção vira um arquivo local para o fluxo existente de anexos. O seletor de arquivos aceita apenas JPG, PNG e WebP. O usuário confirma o envio do GIF do catálogo no chat, com validação, limites e política de moderação existentes. O filtro do catálogo não garante ausência de conteúdo inadequado.

Referências: https://docs.klipy.com/ e https://docs.klipy.com/migrate-from-tenor/response-objects/content-formats

Validação com dados simulados não substitui teste real de busca e envio após configurar a chave.
