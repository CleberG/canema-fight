-- Remove os 18 atletas fictícios do seed (e as lutas de teste deles) e esvazia o card publicado.
-- Mantém o atleta cadastrado manualmente (Gabriel de Oliveira Kistner) e os atletas reais (ids 20 a 31).
-- Ingressos, pedidos e configurações do evento não são alterados.
begin;
delete from public.atletas
where evento_id = 'c3a1f000-0000-4000-8000-000000000001'
  and id between 1 and 18
  and created_at = '2026-11-04 00:36:23.431251+00';
update public.eventos set card_publicado = '[]'::jsonb
where id = 'c3a1f000-0000-4000-8000-000000000001';
commit;
