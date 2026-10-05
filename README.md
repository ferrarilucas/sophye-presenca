# Lista de convidados – XV Sophye

Painel (Next.js, mobile first) com as confirmações do convite [`sophie_aniversary`](https://github.com/ferrarilucas/sophie_aniversary),
no mesmo visual. Lê a tabela `public.rsvps` do mesmo projeto Supabase.

- Resumo: confirmados, quem não vai e total de respostas
- Abas **Confirmados** / **Não poderão**, busca por nome ou recado
- Visão por **grupo** (titular + acompanhantes + recado) ou lista **A–Z** numerada (boa para a recepção)
- Exporta CSV (abre direto no Excel/Sheets)
- Protegido por senha; a página não é indexada

## Configurar (Vercel ou `.env.local`)
| Variável | O que é |
| --- | --- |
| `LISTA_SENHA` | senha para abrir a lista |
| `SUPABASE_URL` | URL do projeto Supabase (aceita também `NEXT_PUBLIC_SUPABASE_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service role (Supabase > Project Settings > API). Fica só no servidor. |

O convite só tem permissão de inserir; por isso a leitura usa a service role, no servidor.

## Rodar
`npm install && npm run dev`
