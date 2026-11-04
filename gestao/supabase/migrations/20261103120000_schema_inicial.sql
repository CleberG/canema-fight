-- Canema Fight · esquema inicial
-- Rode no SQL Editor do Supabase (ou com `supabase db push`).
-- Modelo de acesso:
--   * organizadores (usuários do Supabase Auth ligados ao evento em evento_membros)
--     leem e alteram tudo do seu evento;
--   * visitantes anônimos só leem evento, tipos de ingresso e lotes,
--     e compram ingressos pela função comprar_ingressos.

create schema if not exists private;

-- ───────────────────────── Tabelas ─────────────────────────

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(btrim(nome)) between 1 and 120),
  subtitulo text not null default '',
  data timestamptz not null,
  local text not null default '',
  cidade text not null default '',
  inscricao numeric(10, 2) not null check (inscricao > 0),
  tipo_chave text not null check (tipo_chave in ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  chave_pix text not null,
  recebedor text not null,
  -- Card publicado: só nome público (sem sobrenome de menores) e academia.
  card_publicado jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.evento_membros (
  evento_id uuid not null references public.eventos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (evento_id, user_id)
);
create index evento_membros_user_id_idx on public.evento_membros (user_id);

create table public.atletas (
  id bigint generated always as identity primary key,
  evento_id uuid not null references public.eventos (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 2 and 120),
  sexo text not null check (sexo in ('Feminino', 'Masculino')),
  idade smallint not null check (idade between 5 and 99),
  peso numeric(5, 2) not null check (peso > 0),
  altura numeric(3, 2) check (altura > 0),
  academia text not null,
  professor text not null default '',
  cidade text not null default '',
  lutas smallint not null default 0 check (lutas >= 0),
  luvoes smallint not null default 0 check (luvoes >= 0),
  tempo_treino smallint not null default 0 check (tempo_treino >= 0), -- meses
  instagram text not null default '',
  telefone text not null default '',
  responsavel text not null default '',
  pagamento text not null default 'pendente' check (pagamento in ('pago', 'pendente', 'expirado')),
  pago_em timestamptz,
  created_at timestamptz not null default now()
);
create index atletas_evento_id_idx on public.atletas (evento_id);

-- Matches decididos pelo organizador (aprovados entram no card).
create table public.lutas (
  id bigint generated always as identity primary key,
  evento_id uuid not null references public.eventos (id) on delete cascade,
  atleta_a bigint not null references public.atletas (id) on delete cascade,
  atleta_b bigint not null references public.atletas (id) on delete cascade,
  pontuacao smallint not null check (pontuacao between 0 and 100),
  status text not null check (status in ('aprovada', 'recusada')),
  posicao_card smallint check (posicao_card >= 0), -- null = fora do card
  created_at timestamptz not null default now(),
  check (atleta_a < atleta_b),
  unique (evento_id, atleta_a, atleta_b)
);
create index lutas_atleta_a_idx on public.lutas (atleta_a);
create index lutas_atleta_b_idx on public.lutas (atleta_b);

create table public.tipos_ingresso (
  id bigint generated always as identity primary key,
  evento_id uuid not null references public.eventos (id) on delete cascade,
  slug text not null,
  nome text not null,
  descricao text not null default '',
  ordem smallint not null default 0,
  unique (evento_id, slug)
);

create table public.lotes (
  id bigint generated always as identity primary key,
  tipo_id bigint not null references public.tipos_ingresso (id) on delete cascade,
  nome text not null,
  preco numeric(10, 2) not null check (preco >= 0),
  qtd integer not null check (qtd > 0),
  vendidos integer not null default 0,
  ordem smallint not null default 0,
  check (vendidos between 0 and qtd)
);
create index lotes_tipo_id_idx on public.lotes (tipo_id);

create table public.bilhetes (
  id bigint generated always as identity primary key,
  evento_id uuid not null references public.eventos (id) on delete cascade,
  codigo text not null unique,
  nome text not null,
  idade smallint not null check (idade between 0 and 120),
  tipo_id bigint not null references public.tipos_ingresso (id),
  lote_id bigint not null references public.lotes (id),
  status text not null default 'valido' check (status in ('valido', 'usado', 'cancelado')),
  usado_em timestamptz,
  comprador_email text,
  created_at timestamptz not null default now()
);
create index bilhetes_evento_id_idx on public.bilhetes (evento_id);
create index bilhetes_tipo_id_idx on public.bilhetes (tipo_id);
create index bilhetes_lote_id_idx on public.bilhetes (lote_id);

-- ───────────────────────── Autorização ─────────────────────────

-- Usuário logado é organizador do evento? (SECURITY INVOKER: respeita o RLS de evento_membros)
create function private.e_organizador(p_evento uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.evento_membros m
    where m.evento_id = p_evento and m.user_id = (select auth.uid())
  );
$$;

revoke all on function private.e_organizador(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.e_organizador(uuid) to authenticated;

alter table public.eventos enable row level security;
alter table public.evento_membros enable row level security;
alter table public.atletas enable row level security;
alter table public.lutas enable row level security;
alter table public.tipos_ingresso enable row level security;
alter table public.lotes enable row level security;
alter table public.bilhetes enable row level security;

-- Concede só o necessário. Funciona com ou sem "Automatically expose new tables"
-- (projetos com a opção ligada dão tudo por padrão a anon/authenticated).
grant usage on schema public to anon, authenticated;
revoke all on public.eventos, public.evento_membros, public.atletas, public.lutas,
  public.tipos_ingresso, public.lotes, public.bilhetes from anon, authenticated;

grant select on public.eventos, public.tipos_ingresso, public.lotes to anon, authenticated;
grant update on public.eventos to authenticated;
grant select on public.evento_membros to authenticated;
grant select, insert, update, delete on public.atletas, public.lutas to authenticated;
grant select, update on public.bilhetes to authenticated;

-- eventos: leitura pública, edição só por organizadores
create policy "eventos: leitura pública" on public.eventos
  for select to anon, authenticated using (true);
create policy "eventos: organizador edita" on public.eventos
  for update to authenticated
  using ((select private.e_organizador(id)))
  with check ((select private.e_organizador(id)));

-- evento_membros: cada usuário vê só os próprios vínculos (inclusão é feita pelo SQL Editor)
create policy "membros: vê os próprios" on public.evento_membros
  for select to authenticated using (user_id = (select auth.uid()));

-- atletas e lutas: só organizadores do evento
create policy "atletas: organizador lê" on public.atletas
  for select to authenticated using ((select private.e_organizador(evento_id)));
create policy "atletas: organizador cria" on public.atletas
  for insert to authenticated with check ((select private.e_organizador(evento_id)));
create policy "atletas: organizador edita" on public.atletas
  for update to authenticated
  using ((select private.e_organizador(evento_id)))
  with check ((select private.e_organizador(evento_id)));
create policy "atletas: organizador remove" on public.atletas
  for delete to authenticated using ((select private.e_organizador(evento_id)));

create policy "lutas: organizador lê" on public.lutas
  for select to authenticated using ((select private.e_organizador(evento_id)));
create policy "lutas: organizador cria" on public.lutas
  for insert to authenticated with check ((select private.e_organizador(evento_id)));
create policy "lutas: organizador edita" on public.lutas
  for update to authenticated
  using ((select private.e_organizador(evento_id)))
  with check ((select private.e_organizador(evento_id)));
create policy "lutas: organizador remove" on public.lutas
  for delete to authenticated using ((select private.e_organizador(evento_id)));

-- ingressos e lotes: leitura pública (preços e disponibilidade)
create policy "tipos: leitura pública" on public.tipos_ingresso
  for select to anon, authenticated using (true);
create policy "lotes: leitura pública" on public.lotes
  for select to anon, authenticated using (true);

-- bilhetes: organizador consulta e faz check-in
create policy "bilhetes: organizador lê" on public.bilhetes
  for select to authenticated using ((select private.e_organizador(evento_id)));
create policy "bilhetes: organizador faz check-in" on public.bilhetes
  for update to authenticated
  using ((select private.e_organizador(evento_id)))
  with check ((select private.e_organizador(evento_id)));

-- ───────────────────────── Compra de ingressos ─────────────────────────
-- Endpoint público de propósito: visitantes não têm acesso direto a bilhetes/lotes,
-- então a compra passa por esta função, que valida tudo e baixa o estoque com trava.
-- ATENÇÃO: no protótipo o Pix é simulado, então qualquer visitante consegue emitir
-- ingressos. Na versão final, a emissão deve vir da confirmação do provedor de pagamento.
create function public.comprar_ingressos(p_evento uuid, p_pessoas jsonb, p_email text default null)
returns table (codigo text, nome text, idade smallint, tipo text, lote text, preco numeric)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_p jsonb;
  v_nome text;
  v_idade integer;
  v_tipo public.tipos_ingresso;
  v_lote public.lotes;
  v_codigo text;
begin
  if jsonb_typeof(p_pessoas) is distinct from 'array'
     or jsonb_array_length(p_pessoas) not between 1 and 30 then
    raise exception 'Informe de 1 a 30 ingressos';
  end if;
  if p_email is not null and length(p_email) > 200 then
    raise exception 'E-mail inválido';
  end if;

  for v_p in select value from jsonb_array_elements(p_pessoas) loop
    v_nome := regexp_replace(btrim(coalesce(v_p ->> 'nome', '')), '\s+', ' ', 'g');
    if length(v_nome) not between 3 and 120 or v_nome !~ '\S+\s+\S+' then
      raise exception 'Informe nome e sobrenome de cada participante';
    end if;
    if coalesce(v_p ->> 'idade', '') !~ '^\d{1,3}$' then
      raise exception 'Idade inválida';
    end if;
    v_idade := (v_p ->> 'idade')::integer;
    if v_idade > 120 then
      raise exception 'Idade inválida';
    end if;

    select * into v_tipo from public.tipos_ingresso t
    where t.evento_id = p_evento and t.slug = v_p ->> 'tipo';
    if not found then
      raise exception 'Tipo de ingresso inválido';
    end if;

    -- lote vigente, travado para não vender além do estoque em compras simultâneas
    select * into v_lote from public.lotes l
    where l.tipo_id = v_tipo.id and l.vendidos < l.qtd
    order by l.ordem
    limit 1
    for update;
    if not found then
      raise exception 'Ingresso esgotado: %', v_tipo.nome;
    end if;

    update public.lotes set vendidos = vendidos + 1 where id = v_lote.id;

    loop
      v_codigo := 'CF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      insert into public.bilhetes (evento_id, codigo, nome, idade, tipo_id, lote_id, comprador_email)
      values (p_evento, v_codigo, v_nome, v_idade, v_tipo.id, v_lote.id, nullif(btrim(p_email), ''))
      on conflict (codigo) do nothing;
      exit when found;
    end loop;

    codigo := v_codigo; nome := v_nome; idade := v_idade; tipo := v_tipo.nome; lote := v_lote.nome; preco := v_lote.preco;
    return next;
  end loop;
end;
$$;

revoke all on function public.comprar_ingressos(uuid, jsonb, text) from public;
grant execute on function public.comprar_ingressos(uuid, jsonb, text) to anon, authenticated;
