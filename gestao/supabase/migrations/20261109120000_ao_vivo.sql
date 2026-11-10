-- Lutas ao vivo e vídeo curto do atleta.
-- • eventos.ao_vivo: { atual: id da luta em andamento | null, inicio: timestamp,
--                     resultados: { <id da luta>: { vencedor: 'vermelho'|'azul'|'empate'|null, fim: timestamp } } }
--   A página pública já lê eventos; o organizador já tem permissão de editar.
-- • atletas.video_path: vídeo em loop (mp4) no mesmo bucket das fotos.
-- • Realtime: a página pública recebe a mudança de luta sem recarregar.

alter table public.eventos
  add column ao_vivo jsonb not null default '{}'::jsonb
  check (jsonb_typeof(ao_vivo) = 'object');

alter table public.atletas add column video_path text;

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
where id = 'atletas';

-- O card publicado guarda o caminho do vídeo (vermelho.video / azul.video).
create policy "videos de atletas: card publicado" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'atletas'
    and exists (
      select 1
      from public.eventos e
      cross join lateral jsonb_array_elements(e.card_publicado) l
      where l -> 'vermelho' ->> 'video' = storage.objects.name
         or l -> 'azul' ->> 'video' = storage.objects.name
    )
  );

alter publication supabase_realtime add table public.eventos;
