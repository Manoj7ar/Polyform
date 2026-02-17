do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'spaces'
    ) then
      alter publication supabase_realtime add table public.spaces;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'blocks'
    ) then
      alter publication supabase_realtime add table public.blocks;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'share_links'
    ) then
      alter publication supabase_realtime add table public.share_links;
    end if;
  end if;
end $$;
