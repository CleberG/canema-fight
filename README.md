# Canema Fight — Card de Lutas

Site 100% estático (HTML/CSS/JS, sem build e sem banco de dados).
Corner vermelho à esquerda, corner azul à direita.

## Editar as lutas

Tudo fica em `lutas.js`:

- `EVENTO` — nome e subtítulo do evento.
- `LUTAS` — uma entrada por luta, na ordem em que acontecem:

```js
{
  peso: '67 kg',          // ou 'Peso combinado', ou null
  modalidade: 'Muay Thai', // ou null
  vencedor: null,          // 'vermelho', 'azul', 'empate' ou null
  vermelho: { nome: 'Amanda Machado', equipe: 'Thai Gaspar (Gilmar)' },
  azul:     { nome: 'Letícia de Assis', equipe: 'Thai Gaspar (Carol)' },
},
```

Depois de editar, faça commit/push — o GitHub Pages atualiza o site em ~1 minuto.
Dá para editar direto pelo site do GitHub (abra `lutas.js` e clique no lápis).

## Rodar local

Precisa de um servidor http (abrir o arquivo direto não carrega os módulos JS):

```bash
npx serve .
```

## GitHub Pages

1. Suba a pasta para um repositório no GitHub (arquivos na raiz, branch `main`).
2. No repositório: **Settings > Pages > Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main**, pasta **/ (root)** → Save
3. Em ~1 minuto o site fica em `https://<seu-usuario>.github.io/<repositorio>/`.

O arquivo `.nojekyll` faz o GitHub servir os arquivos como estão, sem processar com Jekyll.

## Protótipo de gestão (`gestao/`)

Protótipo navegável em React + Tailwind do sistema de gestão do evento (dados fictícios):
login, dashboard, colar ficha do WhatsApp, atletas, matches, montagem do card,
pagamentos Pix, página pública com venda de ingressos e portaria com leitor de QR.

```bash
cd gestao
npm install
npm run dev     # abre em http://localhost:5173
npm test        # testes do parser de ficha e das regras de match
```

### Banco de dados (Supabase)

Sem configuração, o protótipo roda em **modo demonstração** (dados fictícios em memória).
Para gravar no Supabase:

1. No **SQL Editor** do projeto, rode `gestao/supabase/migrations/20261103120000_schema_inicial.sql`
   (tabelas, permissões e RLS) e depois `gestao/supabase/seed.sql` (dados fictícios de teste).
2. Em **Authentication › Users › Add user**, crie o organizador (e-mail e senha, marque *Auto Confirm*).
   Em **Authentication › Sign In / Providers**, desligue *Allow new users to sign up*.
3. Ligue o organizador ao evento rodando o último trecho do `seed.sql` com o e-mail dele.
4. Copie `gestao/.env.example` para `gestao/.env.local` e preencha a *Project URL* e a chave
   **publishable** (Project Settings › API Keys). Nunca use a chave secret no front-end.
5. Na Vercel, cadastre as mesmas variáveis em **Settings › Environment Variables** e faça um novo deploy.

Organizadores leem e alteram só o próprio evento. Visitantes só veem evento, card publicado,
ingressos e lotes, e compram pela função `comprar_ingressos` (o Pix ainda é simulado).
