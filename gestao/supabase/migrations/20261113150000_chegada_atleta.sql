-- Chegada do atleta no dia do evento (registrada na portaria).
alter table public.atletas add column chegou_em timestamptz;
