alter table public.flyff_generations add column cursor jsonb not null default '{"resourceIndex":0,"offset":0}';
