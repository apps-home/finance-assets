# Guia de Integração: Open Finance via Pluggy

> Documento de referência arquitetural para conectar bancos e corretoras brasileiras (Nubank, Itaú, Mercado Pago, XP, BTG, etc.) ao **Finance Assets**.

---

## 1. O que é a Pluggy e Por Que Ela?

A [Pluggy](https://pluggy.ai) é a principal plataforma de agregação bancária e Open Finance voltada a desenvolvedores no Brasil:
- **Cobertura**: Suporta os principais bancos comerciais e de investimento do país.
- **Dados Fornecidos**:
  - **Contas e Saldos**: Saldo em conta corrente, poupança e reservas (ótimo para atualizar o saldo de Renda Fixa e Caixa automaticamente).
  - **Investimentos**: Posições em Ações, Fundos Imobiliários, Tesouro Direto, CDBs e Fundos de Investimento (com quantidade, valor atualizado e instituição).
  - **Transações / Extratos**: Histórico de movimentações financeiras.
- **Ambiente Sandbox**: Gratuito para testes com conectores simulados de todos os bancos.

---

## 2. Fluxo de Funcionamento (Arquitetura)

```
┌──────────────┐          ┌────────────────┐          ┌────────────────┐
│   Frontend   │          │  API (NestJS)  │          │  Pluggy Cloud  │
│   (Next.js)  │          │ (Finance API)  │          │   (Open Fin)   │
└──────┬───────┘          └───────┬────────┘          └───────┬────────┘
       │                          │                           │
       │ 1. Solicita Connect Token│                           │
       │─────────────────────────>│                           │
       │                          │ 2. Cria Connect Token     │
       │                          │──────────────────────────>│
       │                          │<──────────────────────────│
       │<─────────────────────────│                           │
       │                          │                           │
       │ 3. Abre Widget Pluggy    │                           │
       │    (Usuário conecta Itaú)│                           │
       │─────────────────────────────────────────────────────>│
       │                          │                           │
       │ 4. Conexão realizada     │                           │
       │    (retorna itemId)      │ 5. Webhook disparado      │
       │─────────────────────────>│    (item/created/updated) │
       │                          │<──────────────────────────│
       │                          │                           │
       │                          │ 6. Busca Investimentos    │
       │                          │    e Saldos da conta      │
       │                          │──────────────────────────>│
       │                          │<──────────────────────────│
       │                          │                           │
       │                          │ 7. Atualiza/Cria Assets   │
       │                          │    no PostgreSQL (Prisma) │
       │                          │                           │
```

---

## 3. Passo a Passo para Integração

### Passo 1: Obter Credenciais na Pluggy
1. Crie uma conta no portal [Pluggy Dashboard](https://dashboard.pluggy.ai).
2. Obtenha seu `CLIENT_ID` e `CLIENT_SECRET`.
3. Adicione as variáveis de ambiente:
   - No `packages/env` e `apps/service/.env`:
     ```env
     PLUGGY_CLIENT_ID="seu_client_id"
     PLUGGY_CLIENT_SECRET="seu_client_secret"
     PLUGGY_WEBHOOK_URL="https://sua-api.com/webhooks/pluggy"
     ```

### Passo 2: Backend (apps/service)
1. **Instalação do SDK oficial**:
   ```bash
   pnpm --filter api add pluggy-sdk
   ```
2. **Criação do Módulo `PluggyModule`** (`src/modules/integrations/pluggy`):
   - **`CreateConnectTokenUseCase`**: Gera um token efêmero para o frontend abrir o widget seguro sem expor credenciais secretas.
   - **`SyncPluggyItemUseCase`**: Dado um `itemId`, busca:
     - `client.fetchAccounts(itemId)` para saldos de conta/caixa.
     - `client.fetchInvestments(itemId)` para posições de ações, FIIs e renda fixa.
   - **Controller de Webhook** (`POST /webhooks/pluggy`):
     - Ouve eventos `item/created`, `item/updated` e enfileira um job no **BullMQ** (`sync-pluggy-data`) para sincronizar em segundo plano.

### Passo 3: Frontend (apps/web)
1. **Instalação do componente do Widget**:
   ```bash
   pnpm --filter web add react-pluggy-connect
   ```
2. **Botão "Conectar Instituição Financeira"**:
   - Cria um modal seguro onde o usuário escolhe a instituição (Nubank, Itaú, Mercado Pago) e faz a autenticação.
   - Ao finalizar com sucesso, chama `queryClient.invalidateQueries({ queryKey: ['assets'] })`.

### Passo 4: Mapeamento dos Dados no Schema
- Criar modelo no Prisma (`packages/lib-db/src/prisma/schema.prisma`):
  ```prisma
  model BankConnection {
    id          String   @id @default(uuid())
    userId      String
    pluggyItemId String  @unique
    connectorId Int
    institutionName String
    status      String   @default("UPDATING")
    lastSyncAt  DateTime?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    user User @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@schema("finance-assets")
    @@map("bank_connections")
  }
  ```
- Vincular cada ativo ao campo opcional `externalId` ou `connectorId` para permitir atualizações automáticas e evitar duplicidade com inserções manuais.
