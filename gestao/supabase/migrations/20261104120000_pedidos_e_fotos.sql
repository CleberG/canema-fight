-- Canema Fight · pedidos de ingresso com pagamento editável e foto do atleta
-- Pedido = uma compra (um Pix) com um ou mais ingressos nominais.
-- A compra pela página pública fica "pendente" até o organizador confirmar o Pix.

-- ───────────────────────── Pedidos ─────────────────────────

create table public.pedidos (
  id bigint generated always as identity primary key,
  evento_id uuid not null references public.eventos (id) on delete cascade,
  comprador_nome text not null,
  comprador_email text,
  total numeric(10, 2) not null check (total >= 0),
  pagamento text not null default 'pendente' check (pagamento in ('pendente', 'pago', 'cancelado')),
  pago_em timestamptz,
  created_at timestamptz not null default now()
);
create index pedidos_evento_id_idx on public.pedidos (evento_id);

alter table public.bilhetes add column pedido_id bigint references public.pedidos (id) on delete cascade;
create index bilhetes_pedido_id_idx on public.bilhetes (pedido_id);

-- Ingressos que já existiam viram um pedido pago cada (cancelados viram pedido cancelado).
do $$
declare
  b record;
  v_id bigint;
begin
  for b in
    select bi.id, bi.evento_id, bi.nome, bi.comprador_email, bi.status, bi.created_at, l.preco
    from public.bilhetes bi join public.lotes l on l.id = bi.lote_id
    where bi.pedido_id is null
  loop
    insert into public.pedidos (evento_id, comprador_nome, comprador_email, total, pagamento, pago_em, created_at)
    values (b.evento_id, b.nome, b.comprador_email, b.preco,
            case when b.status = 'cancelado' then 'cancelado' else 'pago' end,
            case when b.status = 'cancelado' then null else b.created_at end,
            b.created_at)
    returning id into v_id;
    update public.bilhetes set pedido_id = v_id where id = b.id;
  end loop;
end;
$$;

alter table public.bilhetes alter column pedido_id set not null;

alter table public.pedidos enable row level security;
revoke all on public.pedidos from anon, authenticated;
grant select, update on public.pedidos to authenticated;

create policy "pedidos: organizador lê" on public.pedidos
  for select to authenticated using ((select private.e_organizador(evento_id)));
create policy "pedidos: organizador altera pagamento" on public.pedidos
  for update to authenticated
  using ((select private.e_organizador(evento_id)))
  with check ((select private.e_organizador(evento_id)));

-- Compra pública: cria o pedido pendente e os ingressos nominais.
create or replace function public.comprar_ingressos(p_evento uuid, p_pessoas jsonb, p_email text default null)
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
  v_pedido bigint;
  v_total numeric := 0;
begin
  if jsonb_typeof(p_pessoas) is distinct from 'array'
     or jsonb_array_length(p_pessoas) not between 1 and 30 then
    raise exception 'Informe de 1 a 30 ingressos';
  end if;
  if p_email is not null and length(p_email) > 200 then
    raise exception 'E-mail inválido';
  end if;

  insert into public.pedidos (evento_id, comprador_nome, comprador_email, total)
  values (p_evento, left(btrim(coalesce(p_pessoas -> 0 ->> 'nome', '')), 120), nullif(btrim(p_email), ''), 0)
  returning id into v_pedido;

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
    v_total := v_total + v_lote.preco;

    loop
      v_codigo := 'CF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      insert into public.bilhetes (evento_id, pedido_id, codigo, nome, idade, tipo_id, lote_id, comprador_email)
      values (p_evento, v_pedido, v_codigo, v_nome, v_idade, v_tipo.id, v_lote.id, nullif(btrim(p_email), ''))
      on conflict (codigo) do nothing;
      exit when found;
    end loop;

    codigo := v_codigo; nome := v_nome; idade := v_idade; tipo := v_tipo.nome; lote := v_lote.nome; preco := v_lote.preco;
    return next;
  end loop;

  update public.pedidos set total = v_total where id = v_pedido;
end;
$$;

revoke all on function public.comprar_ingressos(uuid, jsonb, text) from public;
grant execute on function public.comprar_ingressos(uuid, jsonb, text) to anon, authenticated;

-- ───────────────────────── Foto do atleta ─────────────────────────

alter table public.atletas add column foto_path text;

-- Bucket privado: fotos (inclusive de menores) só para organizadores, via URL assinada.
-- Caminho dos arquivos: <evento_id>/<arquivo>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('atletas', 'atletas', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Organizador da pasta (1º segmento do caminho = id do evento)? Nunca falha com nome inválido.
create function private.e_organizador_pasta(p_nome text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when split_part(p_nome, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then private.e_organizador(split_part(p_nome, '/', 1)::uuid)
    else false
  end;
$$;

revoke all on function private.e_organizador_pasta(text) from public, anon;
grant execute on function private.e_organizador_pasta(text) to authenticated;

create policy "fotos de atletas: organizador lê" on storage.objects
  for select to authenticated
  using (bucket_id = 'atletas' and (select private.e_organizador_pasta(name)));
create policy "fotos de atletas: organizador envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'atletas' and (select private.e_organizador_pasta(name)));
create policy "fotos de atletas: organizador substitui" on storage.objects
  for update to authenticated
  using (bucket_id = 'atletas' and (select private.e_organizador_pasta(name)))
  with check (bucket_id = 'atletas' and (select private.e_organizador_pasta(name)));
create policy "fotos de atletas: organizador remove" on storage.objects
  for delete to authenticated
  using (bucket_id = 'atletas' and (select private.e_organizador_pasta(name)));
