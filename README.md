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
