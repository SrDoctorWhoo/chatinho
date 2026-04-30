---
description: 
---

📊 Sistema de Chatbot com WhatsApp + IA (MVP)
📌 Visão Geral
Este projeto consiste no desenvolvimento de um sistema de chatbot com integração ao WhatsApp (via API não oficial), com suporte a atendimento humano, automações por fluxo e uso de inteligência artificial.
A arquitetura será baseada em Next.js fullstack, centralizando frontend e backend no mesmo projeto, com suporte a tempo real via serviço separado.

🎯 Objetivo
Criar uma plataforma que permita:


Atendimento automático via bot


Atendimento humano com fila e controle


Integração com WhatsApp


Criação de fluxos de conversa


Uso de IA para respostas inteligentes


Gestão completa via painel administrativo



🧩 Escopo do MVP
✅ Incluído


Painel administrativo


Integração com WhatsApp (API não oficial)


Conexão via QR Code


Envio e recebimento de mensagens


Histórico de conversas


Fila de atendimento


Transferência entre atendentes


Scripts de conversa (fluxos)


Bot com IA


Controle de status de atendimento


⏸️ Em Stand By


Integração com banco de dados externo


Consultas por CPF/CNPJ


Integração com ERP/CRM


Abertura automática de chamados


Atualizações automáticas em sistemas externos



📡 Integração com WhatsApp
Tecnologia sugerida


Evolution API (recomendado)


Alternativas:


WPPConnect


Venom Bot




Funcionalidades


Gerar QR Code


Conectar número


Monitorar status:


Conectado


Desconectado


Aguardando QR




Reiniciar sessão


Receber mensagens via webhook


Enviar mensagens



🏗️ Arquitetura
WhatsApp
↓
API (Evolution / WPPConnect)
↓ webhook
Next.js (API Routes / Server Actions)
↓
Regras (Bot / IA / Fila)
↓
Banco de Dados
↓
Frontend (no próprio Next.js)

⚙️ Backend com Next.js
Estrutura
O backend será implementado dentro do próprio Next.js utilizando:


API Routes (/app/api)


Server Actions


Services internos


Exemplo de rotas
/api/webhook/whatsapp
/api/messages/send
/api/conversations
/api/auth/login

⚡ Tempo Real (Chat)
⚠️ Next.js não é ideal para WebSocket nativo.
Estratégia adotada


Servidor separado com Socket.io


Arquitetura
Next.js (API + Frontend)
+
Servidor Node.js (Socket.io)
Alternativas futuras


Pusher


Ably


Supabase Realtime



🧠 Módulos do Sistema
1. Painel Administrativo


Login


Gestão de usuários


Cadastro de atendentes


Permissões por perfil


Configurações gerais


Monitoramento de conversas



2. Gestão de Conversas


Listagem de conversas


Visualização de histórico


Envio de mensagens


Recebimento em tempo real


Marcar como lida


Arquivar


Encerrar conversa



3. Atendimento Humano


Fila de atendimento


Conversas não atribuídas


Assumir atendimento


Transferência:


Entre atendentes


Entre setores




Observações internas


Status:


aguardando bot


aguardando atendente


em atendimento


encerrado





4. Bot de Atendimento (Fluxos)
Funcionalidades


Mensagem inicial automática


Menus com opções


Respostas automáticas


Fluxos condicionais


Gatilhos por palavra-chave


Redirecionamento de fluxo


Transferência para humano


Exemplo de fluxo
Olá! Como posso ajudar?
1 - Suporte
2 - Financeiro
3 - Comercial
4 - Falar com atendente

5. Inteligência Artificial
Primeira versão


Respostas automáticas inteligentes


Interpretação de mensagens livres


Sugestão de resposta para atendente


Resumo de conversa


Classificação de intenção


Identificação de necessidade de atendimento humano



🗃️ Estrutura de Banco (Inicial)
Tabelas principais
users
attendants
conversations
messages
contacts
chatbot_flows
chatbot_nodes
chatbot_options
conversation_assignments
logs

🔄 Fluxo do Sistema
Cliente envia mensagem
↓
Webhook recebe mensagem
↓
Sistema verifica conversa
↓
Bot responde (fluxo ou IA)
↓
Se necessário → fila de atendimento
↓
Atendente assume
↓
Atendimento ocorre
↓
Conversa encerrada
↓
Dados armazenados

📊 Relatórios (Futuro)


Total de atendimentos


Tempo médio de resposta


Tempo médio de resolução


Atendimentos por atendente


Conversas resolvidas pelo bot


Taxa de transferência para humano


Horários de pico



🚀 Roadmap
Fase 1 — Base


Login


Painel admin


Integração WhatsApp


Webhook


Conversas em tempo real


Fase 2 — Atendimento


Fila


Transferência


Histórico


Status de atendimento


Fase 3 — Automação


Fluxos de conversa


Gatilhos


Horário de atendimento


Fase 4 — IA


Respostas inteligentes


Sugestões


Classificação de intenção


Fase 5 — Integrações


Banco de dados


APIs externas


ERP/CRM


Automação avançada



🧪 Stack Tecnológica
Stack principal
Frontend + Backend: Next.js
Tempo real: Socket.io (servidor separado)
Banco: PostgreSQL ou MariaDB (docker)
ORM: Prisma
WhatsApp: Evolution API
IA: OpenAI API
Auth: NextAuth ou JWT
Deploy: VPS Linux com Docker

⚠️ Observações Técnicas


Uso inicial de API não oficial do WhatsApp


Arquitetura preparada para futura migração para API oficial


WebSocket separado para melhor performance


Possível evolução futura para microserviços



