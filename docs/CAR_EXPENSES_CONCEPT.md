# Car Expenses & Maintenance Tracker — Documentação de Conceito e Arquitetura

> Documento de referência arquitetural e funcional para o desenvolvimento do sistema pessoal de gestão de gastos automotivos e controle de manutenções preventivas/periódicas, compartilhando os submódulos `@lib/db` e `@lib/ui`.

---

## 1. Visão Geral e Objetivo

O objetivo do sistema é substituir o controle manual atualmente feito no **Apple Notes (iPhone)** por uma plataforma web **Mobile-First** (focada em lançamento rápido no posto, pedágio ou oficina pelo celular) e **Desktop** (focada em análise histórica, gráficos de custo e planejamento de revisões).

### Problemas Resolvidos
1. **Registro Centralizado de Despesas**: Combustível, pedágios, estacionamentos, manutenções corretivas/preventivas, documentação (IPVA, licenciamento), seguro, estética/lavagem e multas.
2. **Controle Inteligente de Manutenções Preventivas e Periódicas (Tempo × Quilometragem)**:
   - Monitoramento automático do vencimento de itens periódicos por **tempo** (ex.: troca de óleo a cada 6 meses ou 1 ano, fluido de freio a cada 2 anos) **e/ou por quilometragem** (ex.: a cada 10.000 km), alertando sempre pelo critério que vencer primeiro.
3. **Métricas Automáticas do Veículo**:
   - Consumo real (`km/L`) por tipo de combustível (Gasolina Comum/Aditivada, Etanol, Diesel).
   - Custo por quilômetro rodado (`R$/km`) apenas de combustível e custo total (TCO — *Total Cost of Ownership*).
   - Histórico completo de oficina (peças trocadas, mão de obra, garantia das peças e notas fiscais anexadas).

---

## 2. Pilares Tecnológicos

A aplicação segue exatamente a mesma stack do ecossistema pessoal para maximizar o reaproveitamento de código e infraestrutura:

| Camada | Tecnologia |
|---|---|
| **Frontend Framework** | **Next.js 16** (App Router, React 19, Mobile-First) |
| **Backend Framework** | **NestJS 12** (Arquitetura Modular DDD / Clean Architecture) |
| **Banco de Dados & ORM** | **PostgreSQL** (Neon em DEV / Oracle VM em PROD) + **Prisma 7** (`@lib/db`) |
| **Design System & UI** | **Tailwind CSS v4** (`oklch`), **shadcn/ui** (`base-nova` / Base UI) via submódulo `@lib/ui` |
| **State & Data Fetching** | `@tanstack/react-query`, `@tanstack/react-form`, Zustand (client state) e `nuqs` (URL state) |
| **Processamento Assíncrono** | **Redis + BullMQ** (filas e Cron Jobs diários de alertas de manutenção) |
| **Autenticação** | **Better Auth** (sessões independentes por aplicação, OAuth / E-mail) |
| **Notificações** | **Novu** (Inbox In-App) + **n8n** (alertas de vencimento via e-mail/push/WhatsApp) |
| **Armazenamento de Arquivos** | **Cloudflare R2** (upload de notas fiscais de oficina, comprovantes e foto do veículo) |
| **Gerenciador & Qualidade** | **pnpm** (workspace monorepo com `catalog:`) + **Biome** (tabs, single quotes, no semicolons) |

---

## 3. Estratégia de Compartilhamento dos Submódulos (`@lib/db` e `@lib/ui`)

### 3.1 Banco de Dados e `@lib/db` (Servidor Compartilhado, Bancos e Schemas Isolados)

Os usuários **não** são compartilhados entre sistemas diferentes — cada aplicação possui seu próprio cadastro de usuários (`better-auth`) e seu próprio banco de dados lógico dentro do mesmo servidor PostgreSQL:

- **Ambiente DEV (Cluster Neon)**:
  - Mesmo cluster na Neon, alterando apenas o database na connection string:
    ```env
    # Finance Assets (DEV)
    DATABASE_URL="postgresql://neondb_owner:***@ep-super-bread-acl46x3t-pooler.sa-east-1.aws.neon.tech/personal_db?sslmode=require"

    # Car Expenses (DEV)
    DATABASE_URL="postgresql://neondb_owner:***@ep-super-bread-acl46x3t-pooler.sa-east-1.aws.neon.tech/car_expenses_db?sslmode=require"
    ```
- **Ambiente PROD (VM Oracle)**:
  - Mesma instância PostgreSQL rodando na VM Oracle (`localhost:5432`), utilizando um database separado:
    ```env
    # Car Expenses (PROD)
    DATABASE_URL="postgresql://postgres:***@localhost:5432/car_expenses_db"
    ```

#### Como organizar o `@lib/db` sem misturar `schema.prisma`

Para evitar que um único `schema.prisma` acumule tabelas de múltiplos sistemas e gere conflitos de migrations entre projetos diferentes, o submódulo `packages/lib-db` deve separar os schemas por contexto/aplicação:

```text
packages/lib-db/
├── src/
│   ├── client/
│   │   └── index.ts                      # Pool pg + PrismaPg adapter
│   ├── prisma/
│   │   ├── finance-assets/
│   │   │   ├── schema.prisma             # Schemas: ["better-auth", "finance-assets"]
│   │   │   ├── migrations/
│   │   │   └── generated/
│   │   └── car-expenses/
│   │       ├── schema.prisma             # Schemas: ["better-auth", "car-expenses"]
│   │       ├── migrations/
│   │       └── generated/
│   ├── finance-assets.ts                 # Exporta prismaFinanceAssets e prismaAuth (Finance)
│   ├── car-expenses.ts                   # Exporta prismaCarExpenses e prismaAuth (Car)
│   └── index.ts
└── package.json                          # Exports: ".", "./finance-assets", "./car-expenses"
```

Dessa forma:
1. Cada sistema roda `migrate` apenas sobre a sua própria pasta (`--schema=./src/prisma/car-expenses/schema.prisma`).
2. Cada banco (`personal_db` e `car_expenses_db`) possui sua própria tabela `better-auth.user` independente.
3. O driver de conexão (`src/client/index.ts`) e a governança de versões do Prisma 7 continuam centralizados no submódulo `@lib/db`.

---

### 3.2 Design System e `@lib/ui`

O submódulo `packages/lib-ui` é consumido diretamente como código-fonte (`transpilePackages: ['@lib/ui']`):

- **Tokens e Tema**: Importação direta de `@import "@lib/ui/globals.css";` garantindo a mesma identidade visual corporativa/minimalista (cores em `oklch`, suporte nativo a Light/Dark mode e tipografia `Inter`).
- **Componentes Prontos Reutilizados**:
  - Primitivos shadcn (`base-nova`): `Button`, `Card`, `Dialog`, `Sheet`, `Tabs`, `Table`, `Select`, `Badge`, `Input`, `Label`, `Tooltip`, `Popover`, `DropdownMenu`, `Skeleton`, `Sonner`.
  - Customizados do `@lib/ui`: `ConfirmDeleteDialog`, `FilterSelect`, `ModeToggle`, `ThemeProvider`.
- **Evolução do `@lib/ui` durante o projeto**:
  - Componentes 100% genéricos que surgirem na construção do sistema automotivo (ex.: `DatePicker` com locale `pt-BR`, `CurrencyInput` ou `EmptyState`) podem ser adicionados ao `@lib/ui` e registrados no `exports` do `package.json`, ficando disponíveis automaticamente para o *Finance Assets* e futuros sistemas.

---

## 4. Modelagem do Banco de Dados (`car-expenses/schema.prisma`)

O banco `car_expenses_db` utiliza dois schemas PostgreSQL:
- `better-auth`: `user`, `session`, `account`, `verification` (idêntico ao padrão já utilizado).
- `car-expenses`: tabelas do domínio automotivo.

### 4.1 Visão Geral das Tabelas (`car-expenses`)

| Tabela | Descrição |
|---|---|
| `vehicles` | Veículo cadastrado pelo usuário. Suporta múltiplos veículos (atual e anteriores). Guarda quilometragem atual (`currentOdometerKm`), placa, capacidade do tanque e combustível padrão. |
| `fuel_logs` | Registro de abastecimentos. Armazena data, odômetro no momento do abastecimento, tipo de combustível, litros, preço por litro, valor total, flag `isFullTank`, nome do posto e consumo calculado (`consumptionKmPerLiter`). |
| `vehicle_expenses` | Despesas diversas e operacionais do carro: **Pedágios**, **Estacionamento**, **IPVA**, **Licenciamento**, **Seguro**, **Lavagem/Estética**, **Multas** e **Acessórios**. |
| `maintenance_records` | Registro de uma ida à oficina / revisão executada (preventiva ou corretiva). Armazena data, odômetro, oficina, valor de mão de obra, valor de peças, valor total e anexo da nota fiscal/OS (Cloudflare R2). |
| `maintenance_items` | Peças ou serviços individuais dentro de um `maintenance_record` (ex.: "Óleo 5W30 Sintético", "Filtro de Óleo", "Pastilhas de Freio Dianteiras"), com custo individual, garantia em meses (`warrantyMonths`) e vínculo opcional com um agendamento periódico (`scheduleId`). |
| `maintenance_schedules` | Regras de manutenção preventiva/periódica configuradas para o veículo (ex.: "Troca de Óleo e Filtro" a cada **6 meses** ou **10.000 km**). Controla a última execução, o próximo vencimento (data e km) e o status atual. |

### 4.2 Definição do Schema Prisma

```prisma
generator client {
  provider = "prisma-client"
  output   = "./generated/prisma"
}

datasource db {
  provider = "postgresql"
  schemas  = ["better-auth", "car-expenses"]
}

// ==========================================
// SCHEMA: car-expenses
// ==========================================

enum FuelType {
  GASOLINE_COMMON
  GASOLINE_ADDITIVE
  GASOLINE_PREMIUM
  ETHANOL
  DIESEL
  GNV

  @@schema("car-expenses")
}

enum ExpenseCategory {
  TOLL          // Pedágio
  PARKING       // Estacionamento
  IPVA          // Imposto anual
  LICENSING     // Licenciamento / Taxas DETRAN
  INSURANCE     // Seguro automotivo
  CAR_WASH      // Lavagem / Estética / Higienização
  FINE          // Multa de trânsito
  ACCESSORY     // Acessórios / Equipamentos
  OTHER         // Outras despesas

  @@schema("car-expenses")
}

enum PaymentMethod {
  TAG           // Sem Parar, Veloe, ConectCar, Taggy
  PIX
  CREDIT_CARD
  DEBIT_CARD
  CASH

  @@schema("car-expenses")
}

enum MaintenanceType {
  PREVENTIVE    // Revisão periódica / preventiva
  CORRECTIVE    // Conserto de defeito / quebra
  INSPECTION    // Vistoria / Laudo / Alinhamento

  @@schema("car-expenses")
}

enum ScheduleTriggerRule {
  TIME_ONLY           // Ex.: Palhetas do limpador (a cada 12 meses)
  ODOMETER_ONLY       // Ex.: Rodízio de pneus (a cada 10.000 km)
  WHICHEVER_COMES_FIRST // Ex.: Troca de óleo (6 meses OU 10.000 km)

  @@schema("car-expenses")
}

enum ScheduleAlertStatus {
  ON_TRACK      // Em dia
  DUE_SOON      // Próximo do vencimento (dentro da janela de alerta)
  OVERDUE       // Vencido (por tempo ou por km)

  @@schema("car-expenses")
}

model Vehicle {
  id                     String   @id @default(uuid())
  userId                 String
  name                   String   // Apelido (ex.: "Civic Touring", "Polo Highline")
  brand                  String   // Ex.: Honda, Volkswagen
  model                  String   // Ex.: Civic, Polo
  modelYear              Int      // Ex.: 2023
  manufactureYear        Int?     // Ex.: 2022
  licensePlate           String?  // Placa Mercosul/Antiga
  color                  String?
  currentOdometerKm      Int      // Atualizado automaticamente a cada lançamento com km maior
  initialOdometerKm      Int      // Km no momento em que o usuário adquiriu/cadastrou o carro
  fuelTankCapacityLiters Int?     // Capacidade do tanque (ex.: 50L)
  defaultFuelType        FuelType @default(GASOLINE_COMMON)
  photoUrl               String?
  isActive               Boolean  @default(true) // false quando o veículo é vendido
  notes                  String?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  user                 User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  fuelLogs             FuelLog[]
  expenses             VehicleExpense[]
  maintenanceRecords   MaintenanceRecord[]
  maintenanceSchedules MaintenanceSchedule[]

  @@index([userId, isActive])
  @@map("vehicles")
  @@schema("car-expenses")
}

model FuelLog {
  id                    String         @id @default(uuid())
  vehicleId             String
  userId                String
  date                  DateTime       // Data do abastecimento
  odometerKm            Int            // Odômetro no momento do abastecimento
  fuelType              FuelType
  liters                Decimal        @db.Decimal(10, 3) // Ex.: 42.350 L
  pricePerLiter         Decimal        @db.Decimal(10, 3) // Ex.: R$ 5.899
  totalCost             Decimal        @db.Decimal(12, 2) // Ex.: R$ 249.82
  isFullTank            Boolean        @default(true)     // Essencial para cálculo exato de km/L
  gasStationName        String?        // Nome do posto / bandeira
  paymentMethod         PaymentMethod?
  // Calculado automaticamente quando isFullTank = true e o anterior também foi tanque cheio
  distanceDrivenKm      Int?
  consumptionKmPerLiter Decimal?       @db.Decimal(10, 2) // Ex.: 12.45 km/L
  costPerKm             Decimal?       @db.Decimal(10, 4) // Ex.: R$ 0.4738 / km
  notes                 String?
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([vehicleId, date(sort: Desc)])
  @@index([vehicleId, odometerKm(sort: Desc)])
  @@index([userId])
  @@map("fuel_logs")
  @@schema("car-expenses")
}

model VehicleExpense {
  id              String          @id @default(uuid())
  vehicleId       String
  userId          String
  category        ExpenseCategory
  date            DateTime
  amount          Decimal         @db.Decimal(12, 2)
  description     String          // Ex.: "Pedágio Bandeirantes (Ida/Volta)", "IPVA 1ª Parcela"
  locationOrRoute String?         // Ex.: "SP-348 Campinas", "Shopping Iguatemi"
  odometerKm      Int?            // Opcional para despesas gerais
  paymentMethod   PaymentMethod?
  receiptUrl      String?         // Comprovante no Cloudflare R2
  notes           String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([vehicleId, category, date(sort: Desc)])
  @@index([vehicleId, date(sort: Desc)])
  @@index([userId])
  @@map("vehicle_expenses")
  @@schema("car-expenses")
}

model MaintenanceRecord {
  id           String          @id @default(uuid())
  vehicleId    String
  userId       String
  type         MaintenanceType @default(PREVENTIVE)
  title        String          // Ex.: "Revisão de 40.000 km", "Troca de Óleo e Filtros"
  date         DateTime
  odometerKm   Int
  workshopName String?         // Nome da oficina / concessionária
  laborCost    Decimal         @default(0) @db.Decimal(12, 2) // Mão de obra
  partsCost    Decimal         @default(0) @db.Decimal(12, 2) // Soma das peças
  totalAmount  Decimal         @db.Decimal(12, 2)             // laborCost + partsCost (ou valor fechado)
  invoiceUrl   String?         // PDF/Foto da OS ou Nota Fiscal no Cloudflare R2
  notes        String?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  vehicle Vehicle           @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  user    User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  items   MaintenanceItem[]

  @@index([vehicleId, date(sort: Desc)])
  @@index([vehicleId, odometerKm(sort: Desc)])
  @@index([userId])
  @@map("maintenance_records")
  @@schema("car-expenses")
}

model MaintenanceItem {
  id                  String    @id @default(uuid())
  maintenanceRecordId String
  scheduleId          String?   // Se este item cumpriu uma manutenção periódica programada
  name                String    // Ex.: "Óleo 5W30 Sintético (4L)", "Filtro de Cabine"
  brand               String?   // Ex.: Motul, Mann-Filter, Bosch
  partNumber          String?   // Código da peça (útil para compras futuras)
  quantity            Decimal   @default(1) @db.Decimal(10, 2)
  unitPrice           Decimal   @db.Decimal(12, 2)
  totalPrice          Decimal   @db.Decimal(12, 2)
  warrantyMonths      Int?      // Garantia da peça/serviço em meses (ex.: Bateria 24 meses)
  warrantyUntil       DateTime? // Calculado: record.date + warrantyMonths

  maintenanceRecord MaintenanceRecord    @relation(fields: [maintenanceRecordId], references: [id], onDelete: Cascade)
  schedule          MaintenanceSchedule? @relation(fields: [scheduleId], references: [id], onDelete: SetNull)

  @@index([maintenanceRecordId])
  @@index([scheduleId])
  @@map("maintenance_items")
  @@schema("car-expenses")
}

model MaintenanceSchedule {
  id                     String              @id @default(uuid())
  vehicleId              String
  userId                 String
  title                  String              // Ex.: "Troca de Óleo do Motor e Filtro"
  description            String?             // Especificação (ex.: "Usar 4L de 5W30 API SP")
  triggerRule            ScheduleTriggerRule @default(WHICHEVER_COMES_FIRST)
  // Intervalos de recorrência
  intervalMonths         Int?                // Ex.: 6 (a cada 6 meses) ou 12 (1 ano)
  intervalKm             Int?                // Ex.: 10000 (a cada 10.000 km)
  // Dados da última execução conhecida
  lastExecutedAt         DateTime?
  lastExecutedOdometerKm Int?
  // Próximo vencimento calculado pela entidade de domínio
  nextDueDate            DateTime?           // lastExecutedAt + intervalMonths
  nextDueOdometerKm      Int?                // lastExecutedOdometerKm + intervalKm
  // Configuração de antecedência do alerta
  alertDaysBefore        Int                 @default(30)  // Avisa faltando 30 dias
  alertKmBefore          Int                 @default(500) // Avisa faltando 500 km
  // Estado atual do alerta (evita disparos duplicados no Novu/n8n)
  alertStatus            ScheduleAlertStatus @default(ON_TRACK)
  lastNotifiedAt         DateTime?
  isActive               Boolean             @default(true)
  createdAt              DateTime            @default(now())
  updatedAt              DateTime            @updatedAt

  vehicle        Vehicle           @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  completedItems MaintenanceItem[]

  @@index([vehicleId, isActive])
  @@index([userId, alertStatus])
  @@map("maintenance_schedules")
  @@schema("car-expenses")
}
```

---

## 5. Regras de Negócio e Motores de Domínio

### 5.1 Atualização Automática de Odômetro (`Vehicle.syncOdometer`)
- O usuário **não** precisa abrir o cadastro do carro toda vez para atualizar o km atual.
- Sempre que um **Abastecimento (`FuelLog`)**, **Manutenção (`MaintenanceRecord`)** ou **Despesa (`VehicleExpense`)** é registrado com `odometerKm > vehicle.currentOdometerKm`:
  1. A entidade `Vehicle` atualiza seu `currentOdometerKm`.
  2. Um evento de domínio (`vehicle.odometer-updated`) é emitido para reavaliar imediatamente se alguma manutenção preventiva (`MaintenanceSchedule`) entrou em estado `DUE_SOON` ou `OVERDUE` por quilometragem.

### 5.2 Motor de Manutenções Preventivas e Periódicas (Tempo × Km)
Cada `MaintenanceSchedule` opera como uma máquina de estados avaliada em dois momentos:
1. **Em tempo real**: quando o odômetro do carro sobe ou quando uma manutenção é registrada.
2. **Via Cron Job diário** (`evaluate-maintenance-schedules.cron.ts` às 08:00 `America/Sao_Paulo`): verifica a passagem do tempo em relação ao `nextDueDate`.

#### Regra de Cálculo de Vencimento (`domain/schedule-calculator.ts`)
- **Critério por Tempo** (quando `intervalMonths` está definido):
  - `nextDueDate = addMonths(lastExecutedAt, intervalMonths)`
  - `daysRemaining = differenceInCalendarDays(nextDueDate, today)`
  - Está **Vencido (`OVERDUE`)** se `daysRemaining < 0`.
  - Está **Próximo (`DUE_SOON`)** se `0 <= daysRemaining <= alertDaysBefore`.
- **Critério por Quilometragem** (quando `intervalKm` está definido):
  - `nextDueOdometerKm = lastExecutedOdometerKm + intervalKm`
  - `kmRemaining = nextDueOdometerKm - vehicle.currentOdometerKm`
  - Está **Vencido (`OVERDUE`)** se `kmRemaining <= 0`.
  - Está **Próximo (`DUE_SOON`)** se `0 < kmRemaining <= alertKmBefore`.
- **Consolidação (`WHICHEVER_COMES_FIRST`)**:
  - O status final do agendamento é o **mais crítico** entre Tempo e Km (`OVERDUE` > `DUE_SOON` > `ON_TRACK`).

#### Renovação Automática de Ciclo ao Registrar Manutenção
- No formulário de **Nova Manutenção (`MaintenanceRecord`)**, o usuário pode vincular itens executados aos agendamentos ativos do veículo (ex.: marcar o checkbox *"Cumpre o plano: Troca de Óleo e Filtro"*).
- Ao salvar a manutenção, o caso de uso atualiza automaticamente o `MaintenanceSchedule`:
  - `lastExecutedAt = maintenanceRecord.date`
  - `lastExecutedOdometerKm = maintenanceRecord.odometerKm`
  - Recalcula `nextDueDate` (+6 meses ou +1 ano) e `nextDueOdometerKm` (+10.000 km).
  - Reseta `alertStatus = ON_TRACK`.

#### Templates Padrão ao Cadastrar um Veículo
Ao criar um novo carro, o usuário pode selecionar quais planos preventivos deseja ativar com 1 clique:
| Item Preventivo | Regra Padrão Sugerida | Intervalo Tempo | Intervalo Km |
|---|---|---|---|
| **Troca de Óleo e Filtro de Óleo** | `WHICHEVER_COMES_FIRST` | 6 ou 12 meses | 10.000 km |
| **Filtro de Ar do Motor e Cabine (Ar-condicionado)** | `WHICHEVER_COMES_FIRST` | 12 meses | 10.000 km |
| **Alinhamento, Balanceamento e Rodízio de Pneus** | `WHICHEVER_COMES_FIRST` | 6 meses | 10.000 km |
| **Fluido de Freio (DOT 4)** | `TIME_ONLY` | 24 meses | — |
| **Fluido de Arrefecimento (Aditivo Radiador)** | `WHICHEVER_COMES_FIRST` | 24 meses | 40.000 km |
| **Velas de Ignição / Correia / Óleo de Câmbio** | `WHICHEVER_COMES_FIRST` | 48 meses | 60.000 km |
| **Palhetas do Limpador de Para-brisa** | `TIME_ONLY` | 12 meses | — |

---

### 5.3 Motor de Consumo de Combustível (`domain/fuel-consumption.ts`)
- **Tanque Cheio (`isFullTank = true`)**:
  - Quando o usuário abastece completando o tanque (`isFullTank = true`) e o abastecimento imediatamente anterior também foi `isFullTank = true`:
    - `distanceDrivenKm = currentLog.odometerKm - previousLog.odometerKm`
    - `consumptionKmPerLiter = distanceDrivenKm / currentLog.liters`
    - `costPerKm = currentLog.totalCost / distanceDrivenKm`
- **Abastecimento Parcial (`isFullTank = false`)**:
  - Quando o usuário coloca apenas R$ 50,00 ou R$ 100,00 sem encher o tanque, o sistema registra o gasto normalmente, mas aguarda o próximo `isFullTank = true` somando os litros parciais intermediários para calcular a média real do período sem distorcer o `km/L`.
- **Comparador Etanol vs. Gasolina**:
  - Com base no histórico real do próprio carro no sistema (ex.: o carro faz `8,2 km/L` no Etanol e `11,8 km/L` na Gasolina → paridade real do carro é `69,5%`, não os `70%` genéricos), o dashboard informa qual combustível tem o menor `R$/km` nos preços atuais.

---

## 6. Arquitetura Backend (`apps/service` — NestJS 12)

Segue o padrão de módulos DDD / Clean Architecture, retornando `Either<Left, Right>`, validação de escopo por `userId` via `@CurrentUserId()` e conversão de erros com `toHttpException`:

```text
src/modules/
├── vehicles/          # CRUD de veículos, ativação/inativação, resumo do odômetro
├── fuel-logs/         # CRUD de abastecimentos, recálculo de consumo em cadeia e médias por combustível
├── expenses/          # CRUD de pedágios, estacionamento, IPVA, seguro, lavagens e multas
├── maintenances/      # CRUD de manutenções de oficina + itens trocados + upload de NF no R2 + garantias ativas
├── schedules/         # CRUD de planos preventivos/periódicos, cálculo de vencimento e Cron Job de alertas
├── analytics/         # Dashboard TCO (Custo Total), evolução mensal por categoria, custo por km rodado
└── user/              # Perfil do usuário Better Auth e preferências de alerta
```

### Principais Endpoints da API

| Recurso | Rotas | Filtros (Query Params) |
|---|---|---|
| **Vehicles** | `POST /vehicles`, `GET /vehicles`, `GET/PATCH/DELETE /vehicles/:id` | `status` (`ACTIVE`\|`INACTIVE`) |
| **Fuel Logs** | `POST /fuel-logs`, `GET /fuel-logs`, `GET /fuel-logs/summary`, `PATCH/DELETE /fuel-logs/:id` | `vehicleId`, `fuelType`, `from`, `to`, `year`, `month` |
| **Expenses** | `POST /expenses`, `GET /expenses`, `PATCH/DELETE /expenses/:id` | `vehicleId`, `category` (`TOLL`, `IPVA`, etc.), `from`, `to`, `search` |
| **Maintenances** | `POST /maintenances`, `GET /maintenances`, `GET/PATCH/DELETE /maintenances/:id`, `POST /maintenances/:id/upload-invoice` | `vehicleId`, `type` (`PREVENTIVE`\|`CORRECTIVE`), `year`, `search` |
| **Schedules** | `POST /schedules`, `POST /schedules/seed-defaults`, `GET /schedules`, `PATCH/DELETE /schedules/:id` | `vehicleId`, `alertStatus` (`OVERDUE`\|`DUE_SOON`\|`ON_TRACK`) |
| **Analytics** | `GET /analytics/overview`, `GET /analytics/monthly-costs` | `vehicleId`, `year`, `from`, `to` |

---

## 7. Arquitetura Frontend (`apps/web` — Next.js 16 Mobile-First)

Como o uso principal substitui o **Notes do iPhone** (muitas vezes dentro do carro, no posto de gasolina ou na fila do pedágio), a interface prioriza **lançamento rápido no mobile** e **visão analítica no notebook**.

### 7.1 Experiência Mobile-First (Quick Actions)
- **Botão Flutuante / Barra de Ação Rápida (`+ Novo Registro`)**:
  - Abre um `Sheet` inferior no mobile (ou `Dialog` no desktop) com 3 atalhos diretos:
    1. **Abastecimento**: Preenche automaticamente a data de hoje, o último combustível usado e sugere o odômetro mínimo (`>= currentOdometerKm`). Ao digitar `Litros` e `Preço/Litro`, calcula o `Total` automaticamente (ou vice-versa).
    2. **Pedágio / Despesa Rápida**: Permite lançar um pedágio ou estacionamento em menos de 10 segundos (com chips rápidos de descrição/valores recorrentes que você mais passa).
    3. **Manutenção / Oficina**: Formulário completo com lista dinâmica de peças, mão de obra e vínculo com os planos periódicos.

### 7.2 Organização de Telas e Features (`apps/web/src/features/`)

```text
src/features/
├── dashboard/         # Cards de resumo (Gasto no Mês, R$/km, Consumo Médio, Alertas de Manutenção Próximos) + Gráfico Mensal Empilhado
├── vehicles/          # Seletor do veículo ativo no Header + ficha técnica e odômetro atual
├── fuel-logs/         # Tabela/Lista de abastecimentos, evolução do preço do combustível e card Etanol vs Gasolina
├── expenses/          # Gestão de Pedágios, IPVA, Seguro, Estacionamento e Lavagens com filtros via nuqs
├── maintenances/      # Histórico de revisões, busca por peça trocada (ex.: "quando troquei a bateria?"), status de garantia e download da NF
└── schedules/         # Painel de Manutenções Preventivas com barras de progresso duplas (Tempo restante e Km restante)
```

### 7.3 Painel Visual de Manutenções Preventivas (`/schedules`)
Para cada manutenção periódica (ex.: *Troca de Óleo — 6 meses ou 10.000 km*), o card exibe:
- **Badge de Status** (`@lib/ui/components/badge`):
  - `default` / `secondary`: Em dia (`ON_TRACK`)
  - `outline`: Próximo do vencimento (`DUE_SOON` — ex.: *"Faltam 18 dias ou 420 km"*)
  - `destructive`: Vencido (`OVERDUE` — ex.: *"Vencido há 12 dias"*)
- **Indicadores de Progresso**:
  - Barra de **Tempo**: `4 de 6 meses decorridos (Vence em 15/12/2026)`
  - Barra de **Quilometragem**: `7.200 de 10.000 km rodados (Vence aos 52.200 km)`
- **Ação Direta**: Botão *"Registrar Execução"* que já abre o modal de `MaintenanceRecord` pré-vinculado àquele agendamento.

---

## 8. Roteiro de Implementação (Roadmap)

### Fase 1: Fundação e Submódulos
1. Configurar o novo schema `src/prisma/car-expenses/schema.prisma` no `@lib/db` e exportar o cliente `prismaCarExpenses`.
2. Criar o banco `car_expenses_db` no cluster Neon (DEV) e na VM Oracle (PROD).
3. Inicializar o monorepo do projeto (ou apps dedicados) conectando `@lib/db` e `@lib/ui`.

### Fase 2: Core & Lançamentos do Dia a Dia (Substituição do iPhone Notes)
1. Módulo `vehicles` (cadastro do carro e sincronização automática de odômetro).
2. Módulo `fuel-logs` (registro de abastecimentos e cálculo automático de `km/L`).
3. Módulo `expenses` (registro rápido de pedágios, estacionamentos, IPVA e seguro).

### Fase 3: Oficina, Preventivas e Alertas
1. Módulo `schedules` (planos periódicos por tempo e km + seed de planos padrão).
2. Módulo `maintenances` (histórico de oficina, peças com garantia, anexo de NF no Cloudflare R2 e baixa automática no agendamento preventivo).
3. Cron Job diário + integração com **Novu** (In-App) e **n8n** para avisar quando uma revisão estiver próxima por tempo ou quilometragem.

### Fase 4: Migração do Histórico do Notes e Analytics
1. Script/tela de importação rápida para colar as anotações históricas do **Notes do iPhone** e convertê-las em registros estruturados (`FuelLog`, `VehicleExpense`, `MaintenanceRecord`).
2. Dashboard `analytics` com Custo Total de Propriedade (TCO), comparativo mensal por categoria e custo real por quilômetro rodado.

