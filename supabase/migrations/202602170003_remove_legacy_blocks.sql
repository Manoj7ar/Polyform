delete from public.blocks
where type not in ('document', 'table');
