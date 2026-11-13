-- O organizador passa a ajustar os lotes de ingresso pelo app (Configurações):
-- nome, preço e quantidade; criar lote novo e remover lote sem vendas.
-- "vendidos" continua sendo alterado só pela função comprar_ingressos.

grant update (nome, preco, qtd, ordem) on public.lotes to authenticated;
grant insert (tipo_id, nome, preco, qtd, ordem) on public.lotes to authenticated;
grant delete on public.lotes to authenticated;

create policy "lotes: organizador cria" on public.lotes
  for insert to authenticated
  with check ((select private.e_organizador(t.evento_id) from public.tipos_ingresso t where t.id = tipo_id));

create policy "lotes: organizador edita" on public.lotes
  for update to authenticated
  using ((select private.e_organizador(t.evento_id) from public.tipos_ingresso t where t.id = tipo_id))
  with check ((select private.e_organizador(t.evento_id) from public.tipos_ingresso t where t.id = tipo_id));

-- Lote com ingresso vendido não pode ser removido (os ingressos apontam para ele).
create policy "lotes: organizador remove" on public.lotes
  for delete to authenticated
  using (vendidos = 0 and (select private.e_organizador(t.evento_id) from public.tipos_ingresso t where t.id = tipo_id));
