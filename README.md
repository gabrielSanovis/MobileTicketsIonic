# MobileTicketsIonic

Sistema de Controle de Atendimento em Filas de Laboratório — aplicativo móvel desenvolvido com **Ionic Angular** e **Capacitor**, operando inteiramente no frontend com armazenamento local.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework UI | Ionic 8 + Angular 20 |
| Mobile runtime | Capacitor 8 |
| Linguagem | TypeScript |
| Persistência | localStorage (via `StorageService`) |
| Reatividade | RxJS (BehaviorSubject / Observable) |

---

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Servir no navegador (desenvolvimento)
npm start
# ou
ionic serve

# Build de produção
npm run build

# Sincronizar com Capacitor (Android/iOS)
npx cap sync
```

---

## Telas

### Tab 1 — Totem (AC — Auto-atendimento)

O Totem é a interface voltada ao paciente. Apresenta três botões grandes para emissão de senhas:

| Tipo | Descrição |
|---|---|
| **SP** (Prioritário) | Gestantes, idosos, PcD, lactantes |
| **SG** (Geral) | Atendimento padrão |
| **SE** (Exame/Coleta) | Entrega de material, coleta rápida |

Ao pressionar um botão, o sistema emite a senha com identificador único no formato `YYMMDD-TTSSS` (ex.: `260405-SP001`) e exibe um modal de confirmação com o número para o paciente. O header exibe o horário simulado e o status do expediente. Fora do expediente (07:00–17:00 simulado), os botões ficam desabilitados. O ícone ⚙ abre o modal de **Configurações**.

<img width="425" height="849" alt="image" src="https://github.com/user-attachments/assets/1f6eed42-8e25-42b7-b1e1-8942df5f117c" />

---

### Tab 2 — Painel de Chamadas (TV)

Painel de estilo "televisão" que exibe as **últimas 5 senhas chamadas** em tempo real. A chamada mais recente fica em destaque (maior e com fundo destacado). Cada linha mostra:

- Número da senha
- Tipo (badge colorido: amarelo SP, azul SG, verde SE)
- Nome do guichê de destino
- Horário da chamada (tempo simulado)

Atualiza automaticamente via Observable sem necessidade de recarregar a tela.

<img width="424" height="847" alt="image" src="https://github.com/user-attachments/assets/d243be9e-a4e4-48b0-8183-4e4c54425064" />

---

### Tab 3 — Atendente (AA)

Interface do atendente para gerenciar o fluxo de atendimento:

1. **Selecionar Guichê** — o atendente escolhe seu guichê dentre os configurados (padrão: 3).
2. **Status das filas** — chips que mostram quantas senhas aguardam em cada tipo (SP / SG / SE) e o total.
3. **Chamar Próxima Senha** — retira a próxima senha da fila seguindo a rotação de prioridade `SP → SE → SP → SG → ...`. Há 5% de chance de no-show (a senha é descartada e a próxima é chamada automaticamente).
4. **Painel de atendimento ativo** — exibe a senha em atendimento, tipo, e um timer cronômetro (tempo real em segundos). O atendimento é finalizado automaticamente conforme o tempo de serviço simulado (SP: 10–20 min, SG: 2–8 min, SE: ~1 min).
5. **Finalizar Atendimento** — botão para encerramento manual antecipado.

<img width="424" height="850" alt="image" src="https://github.com/user-attachments/assets/1da0185b-a0b7-401e-b0f2-8a1408f7dbb8" />

---

### Tab 4 — Relatórios

Relatórios diários do sistema:

- **Seletor de data** — escolha entre todas as datas com dados registrados.
- **Cards de resumo** — Emitidas, Atendidas, Não compareceu, Descartadas.
- **Tabela por tipo** — breakdown SP / SG / SE de emitidas e atendidas.
- **TM médio** — tempo médio de atendimento (minutos simulados).
- **Tabela detalhada** — todas as senhas com hora de emissão, hora da chamada, guichê, status e tempo de atendimento.

<img width="422" height="844" alt="image" src="https://github.com/user-attachments/assets/dee063dd-b8e0-4a3e-a668-62df53fc91ee" />

---

### Modal — Configurações

Acessível pelo ícone ⚙ no Totem:

- **Iniciar / Encerrar Expediente** — controla o relógio simulado. Ao encerrar, senhas em espera são descartadas.
- **Número de Guichês** — configurável de 1 a 10 (padrão: 3).
- **Fator de Aceleração** — quantos minutos simulados equivalem a 1 segundo real (padrão: 60×). Permite testar um dia inteiro em ~10 minutos.
- **Apagar Todos os Dados** — zera localStorage e recarrega o app.

---

## Regras de Negócio

| Regra | Detalhe |
|---|---|
| Numeração | `YYMMDD-TTSSS` — sequência reinicia por tipo a cada dia simulado |
| Rotação de prioridade | `SP → SE → SP → SG → SP → SE → SP → SG ...` com fallback se fila vazia |
| No-show | 5% de probabilidade aleatória ao chamar uma senha |
| Tempo de serviço (SP) | Uniforme 10–20 min simulados |
| Tempo de serviço (SG) | Uniforme 2–8 min simulados |
| Tempo de serviço (SE) | 1 min (95%) ou 5 min (5%) simulados |
| Expediente | 07:00–17:00 (tempo simulado). Senhas restantes são descartadas ao encerrar. |
| Painel | Mantém as 5 chamadas mais recentes |

---

## Estrutura do Projeto

```
src/app/
├── models/
│   ├── ticket.model.ts       — Ticket, TicketType, TicketStatus
│   ├── booth.model.ts        — Booth, BoothStatus
│   └── report.model.ts       — DailyReport, TicketDetail
├── services/
│   ├── storage.service.ts    — Abstração localStorage
│   ├── time.service.ts       — Relógio simulado com fator de aceleração
│   ├── ticket.service.ts     — Emissão e persistência de senhas
│   ├── queue.service.ts      — Filas por tipo + rotação de prioridade
│   ├── booth.service.ts      — Gerenciamento de guichês
│   ├── attendance.service.ts — Orquestração do fluxo de atendimento
│   └── report.service.ts     — Geração de relatórios
├── totem/                    — Tab 1 — Emissão de senhas (AC)
├── painel/                   — Tab 2 — Painel de chamadas (TV)
├── atendente/                — Tab 3 — Interface do atendente (AA)
├── relatorios/               — Tab 4 — Relatórios diários
├── configuracoes/            — Modal de configurações
└── tabs/                     — Shell das abas
```
