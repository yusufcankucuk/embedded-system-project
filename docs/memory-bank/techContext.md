# Teknik Bağlam (Tech Context)

## Teknoloji Yığını (Tech Stack)
- **Frontend Framework:** Next.js 16+ (App Router)
- **Stil Yönetimi:** Tailwind CSS v4
- **Programlama Dili:** TypeScript (kesin ve sıkı tip denetimi zorunludur, `any` kullanımı yasaktır).
- **Veritabanı & Backend As A Service:** Supabase (PostgreSQL 15+)
- **Araçlar & Kütüphaneler:** Supabase JS Client
- **IoT Simülatör (Ayrı Servis):** Node.js 

## Geliştirme Kuralları
- Prisma, Drizzle vb. dış ORM kullanılmayacaktır. Yalnızca *Supabase Client* ve SQL tabanlı yaklaşımlar geçerlidir.
- Modüler component mimarisi uygulanacak (barrel export yöntemi `index.ts` ile).
- Veritabanı sorgularında oluşan tipler *generic* olarak Supabase arayüzünden (Type generation) beslenmelidir.
- `.env.local` içinde yerel Supabase referansları tutulmalıdır.

## İş Akışı
Her büyük geliştirme öncesi `docs/PROGRESS.md` ve genel memory-bank yapıları kontrol edilmeli, geliştirme bittiğinde `PROGRESS.md` içindeki aşama güncellenmeli ve ilerlenmelidir.
