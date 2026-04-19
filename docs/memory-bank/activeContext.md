# Aktif Bağlam (Active Context)

## Şu An Ne Üzerinde Çalışıyoruz?
Projenin veritabanı şeması (Supabase PostgreSQL tabanında) tamamen kodlandı ve test/üretim altyapısına hazır. Next.js 16 (App Router) ile web tabanlı frontend yapısı oluşturuldu. 

**Mevcut Odak Noktası:**
Aktif olarak IoT Sensör Simülatörü servisini inşa etme aşamasındayız. (Bkz: `docs/PROGRESS.md` Adım 3). 

## Son Değişiklikler
- Supabase SQL şemaları, triggger'lar (sensör son görülme zamanı) ve RBAC/RLS politikaları (`docs/schema.sql` içinde) tanımlandı.
- Next.js ve Tailwind CSS altyapısı ayağa kaldırıldı (`web/` klasörü).

## Sıradaki Adımlar (Gelecek Vizyonu)
1. **Node.js Simülatörü:** Bağımsız olarak çalışacak ve `sensor_data` tablosuna sahte (mock) ama anlamlı veriler gönderecek uygulamanın yazılması.
2. **Admin Paneli:** Supabase istemcisini kullanarak CRUD işlemlerinin (okul, sınıf, sensör yaratma ve atama) arayüze entegrasyonu.
3. **Okul Dashboard:** Realtime Supabase abonelikleriyle, aktif sensör verilerinin renkli eşiklerle görüntülenmesi ve grafiksel hale getirilmesi.
