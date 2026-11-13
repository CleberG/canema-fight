-- Ingressos vendidos fora do app (lista da organização) podem não ter a idade informada.
alter table public.bilhetes alter column idade drop not null;
