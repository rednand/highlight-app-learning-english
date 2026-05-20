# Supabase — padrões de acesso

- Em Server Components: use sempre `app/utils/supabase/server.ts`.
- Em Client Components: use apenas `app/utils/supabase/client.ts`.
- Nunca chame o Supabase diretamente de um Client Component — passe por Server Actions em `app/actions/`.
- Todas as mutações devem usar Server Actions com diretiva `'use server'`.
- O admin client (`app/utils/supabase/admin.ts`) é exclusivo para operações service-role. Nunca o exponha ao browser.
- Ao tocar em queries, verifique se as políticas RLS não estão sendo contornadas.
