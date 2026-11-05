-- Card público dentro do sistema de gestão.
-- • Atletas vindos de cartazes podem ficar sem idade/peso até a organização completar.
-- • Cada luta pode ter um rótulo de categoria ("Peso combinado", "66 kg").
-- • Fotos dos atletas que estão no card publicado ficam visíveis para o público.

alter table public.atletas alter column idade drop not null;
alter table public.atletas alter column peso drop not null;

alter table public.lutas
  add column categoria text check (categoria is null or length(btrim(categoria)) between 1 and 40);

-- O card publicado guarda o caminho da foto (vermelho.foto / azul.foto).
create policy "fotos de atletas: card publicado" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'atletas'
    and exists (
      select 1
      from public.eventos e
      cross join lateral jsonb_array_elements(e.card_publicado) l
      where l -> 'vermelho' ->> 'foto' = storage.objects.name
         or l -> 'azul' ->> 'foto' = storage.objects.name
    )
  );
