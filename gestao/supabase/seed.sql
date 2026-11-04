-- Canema Fight · dados fictícios para teste
-- Rode no SQL Editor depois da migração. O id do evento é fixo para
-- combinar com VITE_EVENTO_ID do .env.example.

insert into public.eventos (id, nome, subtitulo, data, local, cidade, inscricao, tipo_chave, chave_pix, recebedor)
values ('c3a1f000-0000-4000-8000-000000000001', 'Canema Fight 3', 'Noite de Muay Thai',
        '2026-12-12 18:00:00-03', 'Ginásio Municipal Canema', 'Blumenau / SC', 80,
        'email', 'pix@canemafight.com.br', 'Canema Fight Eventos');

insert into public.atletas (evento_id, nome, sexo, idade, peso, altura, academia, professor, lutas, luvoes, tempo_treino, instagram, cidade, pagamento, pago_em)
select 'c3a1f000-0000-4000-8000-000000000001', v.nome, v.sexo, v.idade, v.peso, v.altura, v.academia, v.professor,
       v.lutas, v.luvoes, v.tempo_treino, v.instagram, 'Blumenau / SC', v.pagamento,
       case when v.pagamento = 'pago' then now() - interval '3 days' end
from (values
  ('Larissa Prado Vieira', 'Feminino', 24, 57.2, 1.64, 'Kombat Thai', 'Kru Diego', 4, 6, 30, '@lari.kombat', 'pago'),
  ('Bruna Tavares Lins', 'Feminino', 26, 56.4, 1.61, 'Leões do Vale', 'Prof. Marcos', 5, 4, 36, '@brunatlins', 'pago'),
  ('Camila Rocha Antunes', 'Feminino', 21, 61.0, 1.68, 'Dragão Negro CT', 'Kru Ana', 1, 3, 14, '@camirocha', 'pendente'),
  ('Juliana Ferraz Dias', 'Feminino', 23, 60.1, 1.66, 'Kombat Thai', 'Kru Diego', 2, 2, 16, '@ju.ferraz', 'pago'),
  ('Sofia Mendes Kraus', 'Feminino', 15, 48.3, 1.57, 'Leões do Vale', 'Prof. Marcos', 1, 4, 18, '@sofi.kraus', 'pago'),
  ('Helena Castro Pinho', 'Feminino', 16, 49.5, 1.59, 'Dragão Negro CT', 'Kru Ana', 2, 3, 20, '@helenacp', 'pendente'),
  ('Rafael Nunes Belo', 'Masculino', 28, 71.8, 1.76, 'Leões do Vale', 'Prof. Marcos', 6, 5, 48, '@rafabelo', 'pago'),
  ('Thiago Lemos Carvalho', 'Masculino', 27, 72.5, 1.78, 'Kombat Thai', 'Kru Diego', 7, 4, 50, '@thiagolemos', 'pago'),
  ('Gustavo Pereira Hass', 'Masculino', 19, 65.9, 1.72, 'Muay Thai Itoupava', 'Kru Paulo', 0, 2, 10, '@gus.hass', 'pendente'),
  ('Lucas Andrade Weiss', 'Masculino', 20, 66.7, 1.74, 'Dragão Negro CT', 'Kru Ana', 1, 1, 12, '@lucasweiss', 'pago'),
  ('Pedro Henrique Zimmer', 'Masculino', 14, 44.0, 1.55, 'Kombat Thai', 'Kru Diego', 0, 3, 12, '@pedrozimmer', 'pago'),
  ('Enzo Machado Rosa', 'Masculino', 15, 45.2, 1.58, 'Muay Thai Itoupava', 'Kru Paulo', 1, 2, 14, '@enzo.rosa', 'expirado'),
  ('Mateus Correia Lopes', 'Masculino', 31, 80.4, 1.82, 'Muay Thai Itoupava', 'Kru Paulo', 9, 3, 72, '@mateuscl', 'pago'),
  ('André Siqueira Brum', 'Masculino', 29, 81.9, 1.80, 'Leões do Vale', 'Prof. Marcos', 8, 6, 60, '@andrebrum', 'pendente'),
  ('Vitória Lang Schulz', 'Feminino', 17, 58.0, 1.65, 'Muay Thai Itoupava', 'Kru Paulo', 0, 1, 8, '@vic.schulz', 'pago'),
  ('Isadora Ramos Faria', 'Feminino', 22, 57.9, 1.63, 'Muay Thai Itoupava', 'Kru Paulo', 3, 5, 26, '@isaramos', 'pago'),
  ('Diego Fontes Arruda', 'Masculino', 25, 70.6, 1.75, 'Muay Thai Itoupava', 'Kru Paulo', 5, 5, 40, '@diegoarruda', 'pago'),
  ('Nicolas Becker Prates', 'Masculino', 16, 60.3, 1.70, 'Leões do Vale', 'Prof. Marcos', 2, 3, 22, '@nico.becker', 'pendente')
) as v(nome, sexo, idade, peso, altura, academia, professor, lutas, luvoes, tempo_treino, instagram, pagamento);

with tipos as (
  insert into public.tipos_ingresso (evento_id, slug, nome, descricao, ordem) values
    ('c3a1f000-0000-4000-8000-000000000001', 'pista', 'Pista', 'Arquibancada geral', 1),
    ('c3a1f000-0000-4000-8000-000000000001', 'meia', 'Meia-entrada', 'Estudantes, idosos e PcD · documento na portaria', 2),
    ('c3a1f000-0000-4000-8000-000000000001', 'ringside', 'Ringside', 'Cadeira numerada na beira do ringue', 3)
  returning id, slug
)
insert into public.lotes (tipo_id, nome, preco, qtd, vendidos, ordem)
select t.id, l.nome, l.preco, l.qtd, l.vendidos, l.ordem
from tipos t
join (values
  ('pista', '1º lote', 30, 150, 150, 1),
  ('pista', '2º lote', 40, 250, 162, 2),
  ('pista', '3º lote', 50, 100, 0, 3),
  ('meia', '1º lote', 15, 80, 80, 1),
  ('meia', '2º lote', 20, 120, 38, 2),
  ('ringside', 'Lote único', 120, 60, 54, 1)
) as l(slug, nome, preco, qtd, vendidos, ordem) on l.slug = t.slug;

insert into public.bilhetes (evento_id, codigo, nome, idade, tipo_id, lote_id, status, usado_em)
select 'c3a1f000-0000-4000-8000-000000000001', b.codigo, b.nome, b.idade, t.id, l.id, b.status,
       case when b.status = 'usado' then now() - interval '30 minutes' end
from (values
  ('CF3-7K2Q9', 'Marina Souza Teles', 29, 'pista', '2º lote', 'valido'),
  ('CF3-3H8LM', 'Carlos Eduardo Ritter', 41, 'ringside', 'Lote único', 'valido'),
  ('CF3-9P4XA', 'Fernanda Klein', 19, 'meia', '1º lote', 'valido'),
  ('CF3-1B6TR', 'Rodrigo Albuquerque', 35, 'pista', '1º lote', 'usado'),
  ('CF3-5Z0NC', 'Patrícia Vogel', 52, 'pista', '2º lote', 'cancelado'),
  ('CF3-8W3DE', 'Henrique Batista', 33, 'ringside', 'Lote único', 'valido'),
  ('CF3-2M7GU', 'Aline Fritzen', 67, 'meia', '2º lote', 'usado')
) as b(codigo, nome, idade, slug, lote, status)
join public.tipos_ingresso t on t.evento_id = 'c3a1f000-0000-4000-8000-000000000001' and t.slug = b.slug
join public.lotes l on l.tipo_id = t.id and l.nome = b.lote;

-- Organizador: crie o usuário em Authentication › Users › Add user,
-- troque o e-mail abaixo pelo dele e rode este trecho.
insert into public.evento_membros (evento_id, user_id)
select 'c3a1f000-0000-4000-8000-000000000001', u.id
from auth.users u
where u.email = 'SEU-EMAIL@exemplo.com'
on conflict do nothing;
