# My Daily Compass

Aplicação web de **gestão pessoal e de pequenos negócios**, em português, pensada para
quem toca vários negócios ao mesmo tempo e precisa de ver tudo num único sítio: a rotina
do dia, as tarefas, quem lhe deve dinheiro, o que tem a pagar, o stock e o lucro de cada
negócio.

> Estado: em desenvolvimento activo. Actualmente é uma app de utilizador único
> (cada conta vê só os seus dados). O caminho para produto multi-utilizador está
> descrito em [Roadmap](#roadmap).

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arranque local](#arranque-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura do projecto](#estrutura-do-projecto)
- [Modelo de dados](#modelo-de-dados)
- [Edge Functions](#edge-functions)
- [Servidor MCP](#servidor-mcp)
- [Testes](#testes)
- [Fluxo de trabalho: local, GitHub e Lovable](#fluxo-de-trabalho-local-github-e-lovable)
- [Roadmap](#roadmap)

---

## Funcionalidades

A app organiza-se em oito separadores (`src/components/garcia/`):

| Separador | Ficheiro | O que faz |
|---|---|---|
| **Rotina** | `TabRotina.tsx` | Blocos horários do dia com checklist diário. Blocos editáveis e agrupados por categoria (Manhã, Trabalho, Pausa, Estudo, Pessoal, Família, Noite). Inclui geração de rotina por IA. |
| **Tarefas** | `TabTarefas.tsx` | Lista de tarefas com prioridade (Urgente/Importante/Normal), categoria e prazo. |
| **A Receber** | `TabDevedores.tsx` | Devedores com valor original, pagamentos parciais e histórico. |
| **A Pagar** | `TabContasPagar.tsx` | Contas a pagar com credor, categoria, prazo e pagamentos parciais. |
| **Negócios** | `TabNegocios.tsx` + `StockSection.tsx` | Um cartão por negócio com receita, gastos, meta, notas, histórico completo de vendas e gastos, e gestão de stock (quantidade, custo unitário, preço de venda). |
| **Aprendizado** | `TabAprendizado.tsx` | Áreas de estudo com objectivo, tópicos e notas. |
| **Finanças** | `TabFinancas.tsx` | Entradas e saídas por categoria, com gráficos (Recharts). |
| **Configurações** | `TabConfig.tsx` | Nome, moeda, categorias personalizadas, notificações e modo "ocultar valores". |

Transversais:

- **Autenticação** por email/password via Supabase (`src/pages/Auth.tsx`).
- **Ocultar valores** — um botão no cabeçalho mascara todos os montantes (`fmtMasked`),
  útil para usar a app em público.
- **Notificações** do browser (`src/lib/notifications.ts`).
- **Gravação automática** com *debounce* de 500 ms por chave de dados.
- **Tema claro, escuro ou do sistema** — o escuro é o predefinido. As duas paletas
  vivem em `src/index.css` (`:root` para o claro, `.dark` para o escuro) e todos os
  pares de cor usados passam WCAG AA (4.5:1) no tema claro. Um script inline no
  `index.html` aplica o tema antes da primeira pintura, para não haver flash branco.
- **Moeda à escolha** — 9 moedas com o respectivo símbolo (`src/lib/moeda.ts`). A moeda
  activa é distribuída por contexto React; os componentes usam `useFmt()` e
  `useFmtMasked()` em vez de um formatador fixo. Os valores são guardados como números
  simples, sem conversão de câmbio: mudar de moeda reescreve o símbolo, não converte.

## Stack

- **Vite 5** + **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix UI) — componentes em `src/components/ui/`
- **Supabase** — autenticação, base de dados (Postgres com RLS) e Edge Functions
- **TanStack Query**, **React Router**, **React Hook Form** + **Zod**, **Recharts**
- **Vitest** + **Testing Library**
- Projecto criado no **Lovable** (`lovable-tagger`, `@lovable.dev/mcp-js`)

## Arranque local

Requisitos: Node 18+ (ou Bun) e um projecto Supabase.

```bash
npm install     # ou: bun install
npm run dev     # http://localhost:8080
```

O ficheiro `.env` já vem no repositório com as chaves públicas do Supabase (ver secção
seguinte).

Scripts disponíveis:

| Comando | Efeito |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção para `dist/` |
| `npm run build:dev` | Build em modo development (útil para depurar) |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run lint` | ESLint |
| `npm test` | Vitest, uma passagem |
| `npm run test:watch` | Vitest em modo watch |

## Variáveis de ambiente

Ficheiro `.env` na raiz:

```dotenv
VITE_SUPABASE_PROJECT_ID="..."
VITE_SUPABASE_PUBLISHABLE_KEY="..."   # chave anon/publishable — pode ser pública
VITE_SUPABASE_URL="https://<project>.supabase.co"
```

Do lado do servidor (secrets das Edge Functions, definidos no painel do Supabase):

```
LOVABLE_API_KEY      # usada por gerar-rotina para chamar o AI Gateway
```

> **Nunca** colocar a chave `service_role` em variáveis `VITE_*` — tudo o que tem esse
> prefixo é embutido no bundle e fica visível no browser. A segurança dos dados assenta
> nas políticas RLS, não no segredo da chave publishable.

## Estrutura do projecto

```
src/
├── pages/
│   ├── Index.tsx              # shell da app: estado global, tabs, carregamento/gravação
│   ├── Auth.tsx               # login e registo
│   ├── OAuthConsent.tsx       # ecrã de consentimento OAuth (integração MCP)
│   └── NotFound.tsx
├── components/
│   ├── garcia/                # os oito separadores + componentes partilhados
│   └── ui/                    # shadcn/ui
├── lib/
│   ├── garcia.ts              # tipos, helpers, constantes, load() e save()
│   ├── moeda.ts               # moedas suportadas, formatação e contexto React
│   ├── notifications.ts
│   ├── icons.tsx
│   └── mcp/                   # servidor MCP: index.ts, supabase.ts, tools/
├── integrations/supabase/     # cliente, tipos gerados, storage de auth em preview
├── hooks/                     # use-mobile, use-toast
└── test/                      # setup do Vitest

supabase/
├── config.toml
├── migrations/                # schema SQL
└── functions/
    ├── gerar-rotina/          # geração de rotina por IA
    └── mcp/                   # AUTO-GERADO a partir de src/lib/mcp — não editar
```

## Modelo de dados

Toda a informação do utilizador vive numa única tabela chave-valor:

```sql
CREATE TABLE public.user_data (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  data_key   TEXT NOT NULL,
  data_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, data_key)
);
```

RLS activo, com quatro políticas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) todas presas a
`auth.uid() = user_id`. Cada separador guarda o seu estado numa chave própria
(`devedores`, `negocios`, `tarefas`, `financas`, `config`, …) através de
`load()` e `save()` em `src/lib/garcia.ts`.

Este desenho é simples, mas não permite consultas relacionais nem partilha entre
utilizadores. Por isso o **núcleo de negócio já foi movido para tabelas próprias**
(migração `20260909120000_projectos_relacionais.sql`):

| Tabela | O que guarda |
|---|---|
| `profiles` | espelho legível de `auth.users` — necessário para convidar por email |
| `projects` | o que a app chama "negócio"; é a entidade que se partilha |
| `project_members` | colaboradores, com papel `editor` ou `leitor` |
| `project_invites` | convites por email, com token e validade |
| `transactions` | vendas e gastos — o antigo `log`, agora sem limite |
| `stock_items` | stock por projecto |
| `activity_log` | quem fez o quê, para o feed de colaboração |

O acesso é decidido por três funções `SECURITY DEFINER` — `pode_ver_projecto`,
`pode_editar_projecto` e `e_dono_do_projecto` — chamadas de dentro das políticas RLS.
Têm de ser `SECURITY DEFINER` para poderem ler `project_members` sem reentrar nas
políticas, que de outro modo entrariam em recursão.

**Totais anteriores à migração.** Como o antigo `enforceLogLimits` apagava transações,
somar as que restam daria um valor muito abaixo do real. As colunas
`projects.receita_legado` e `gastos_legado` guardam a diferença, e o total mostrado é
`legado + soma das transações` — o que reproduz exactamente os números antigos.

O que é pessoal e nunca se partilha — rotina, tarefas, aprendizado, finanças pessoais e
configurações — continua em `user_data`. A migração é aditiva: não toca nos dados
antigos, que ficam como rede de segurança.

Os tipos TypeScript de cada entidade (`Devedor`, `Negocio`, `StockItem`, `Tarefa`,
`ContaPagar`, `Financas`, `BlocoRotina`, `AprendizadoArea`, `Configuracoes`) estão todos
em `src/lib/garcia.ts`.

## Edge Functions

### `gerar-rotina`

Recebe `{ rotinaAtual, objetivos }`, chama o AI Gateway do Lovable
(`google/gemini-2.5-flash`) com um *tool call* estruturado e devolve um resumo mais uma
lista de blocos de rotina propostos. Trata o `429` (limite de pedidos) devolvendo uma
mensagem legível.

### `mcp`

**Ficheiro auto-gerado** pelo plugin Vite do `@lovable.dev/mcp-js` a partir de
`src/lib/mcp/`. Não editar à mão — alterar as ferramentas em `src/lib/mcp/tools/` e
deixar o plugin regenerar.

> ⚠️ **Em Windows a regeneração falha.** Correr `npm run dev` ou `npm run build` localmente
> substitui este ficheiro por um esboço com um caminho absoluto
> (`import mcp from "npm:D:\..."`), o que parte a função em produção. Antes de cada
> commit, verificar:
>
> ```bash
> git diff --stat supabase/functions/mcp/index.ts
> ```
>
> Se aparecerem centenas de linhas removidas, é isto — `git checkout -- supabase/functions/mcp/index.ts`
> e aplicar as alterações à mão, ou deixar o Lovable regenerar do lado dele.

## Servidor MCP

A app expõe as suas próprias ferramentas MCP, o que permite controlá-la a partir de um
assistente de IA externo. Ferramentas em `src/lib/mcp/tools/`:

| Ferramenta | Descrição |
|---|---|
| `list-tarefas` | Lista as tarefas do utilizador |
| `add-tarefa` | Cria uma tarefa |
| `complete-tarefa` | Marca uma tarefa como feita |
| `list-devedores` | Lista quem deve dinheiro |
| `financas-resumo` | Resumo de entradas e saídas |
| `negocios-resumo` | Resumo por negócio |

Todas exigem autenticação e operam sob a mesma RLS — cada ferramenta só chega aos dados
do utilizador autenticado.

## Testes

```bash
npm test
```

Vitest com ambiente jsdom, setup em `src/test/setup.ts`. A cobertura é ainda pequena:
`src/test/log.test.ts` cobre o registo de transações (regressão da truncagem de
histórico). Os cálculos de saldo, lucro e margem são o próximo alvo natural.

## Fluxo de trabalho: local, GitHub e Lovable

Este repositório está ligado ao Lovable através do GitHub, com sincronização nos dois
sentidos:

```
edição local → git commit → git push origin main → Lovable puxa → editor e site actualizados
edição no Lovable → commit automático → git pull (local)
```

Regras práticas:

1. **Fazer sempre `git pull` antes de começar** a trabalhar localmente.
2. **Uma alteração local só chega ao Lovable depois do `push`.** Guardar o ficheiro não
   chega.
3. **Não editar nos dois lados ao mesmo tempo** — dá conflito de merge.
4. Alterações a `supabase/migrations/` e às Edge Functions viajam no repositório, mas
   confirmar sempre no painel do Supabase se a migração foi de facto aplicada.

## Roadmap

Direcção do produto: passar de ferramenta pessoal a serviço para pequenos empreendedores.

- [x] **Multi-moeda** — 9 moedas (AOA, EUR, USD, BRL, MZN, CVE, ZAR, GBP, NGN) com o
      respectivo símbolo, escolhidas no onboarding e em Configurações — ver `src/lib/moeda.ts`
- [x] **Onboarding genérico** — assistente inicial de 4 passos; negócios, rotina e
      categorias deixaram de vir pré-preenchidos e são definidos pelo utilizador
- [x] **Histórico completo** — o registo de transações deixou de ser truncado na
      gravação; o limite passou para a apresentação, com "ver tudo"
- [ ] **Internacionalização** — português e inglês
- [x] **Tema claro e escuro** — via `next-themes`, com opção "Sistema"; o escuro
      continua a ser o predefinido
- [x] **Diálogos próprios** — os `confirm()` nativos deram lugar a `ConfirmarDialog`
- [~] **Colaboração em projectos** — esquema relacional, RLS e migração de dados feitos;
      falta adaptar a app e construir os convites e o feed de actividade
- [ ] **Leitura de facturas por fotografia** — extrair valor, data e fornecedor
- [ ] **Assistente de IA de negócio** — para além da rotina, ajudar a estruturar a ideia
- [ ] **Planos** — nível gratuito e subscrição paga
