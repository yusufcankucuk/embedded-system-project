# Sistem Desenleri (System Patterns)

## Mimari Prensipler
- **Client-Server & Realtime Hibrit:** Veriler asinkron bir backend (Supabase) üzerine işlenirken, istemciye WebSockets (Supabase Realtime) ile canlı akıtılır.
- **Microservices Benzeri Ayrım:** IoT ortamını simüle eden sistem (Node.js Simulator), ana web uygulamasından (Next.js) tamamen bağımsız bir repo alt klasörü/servisidir. Asla doğrudan veritabanı bağlantısı yerine, güvenli HTTP REST veya Supabase Client üzerinden iletişim kurması planlanmıştır. Doğrudan supabase SDK'sını kullanır fakat kod tabanı karıştırılmaz.

## Veri Modelleri & İlişkiler
1. `schools` -> 1 Okul (n) Sınıf içerir, (n) Sensör barındırabilir.
2. `classrooms` -> 1 Sınıf (n) Sensörü (indoor) barındırabilir.
3. `sensors` -> Bağımsız cihaz kaydı. `indoor` ise sınıfa bağlıdır, `outdoor` ise doğrudan okula bağlıdır.
4. `sensor_data` -> Zaman serisi verisidir (Time-series). Veritabanındaki `timestamp` baz alınarak veri ambarlanması hedeflenir.

## Anahtar Veritabanı Desenleri
- **Trigger'lar ile Güncelleme:** Sensör verisi sisteme (`sensor_data`) girdiği anda bir Postgres veritabanı tetikleyicisi (`update_sensor_last_seen`) çalışarak sensörün son görülme hızını ve batarya kapasitesini `sensors` tablosunda günceller.
- **PostgreSQL Views:** Dashboard ve admin tablosunda karmaşık sorgular yerine hazır görünümler (Views) (`classroom_live_status`, `unassigned_sensors`, vb.) kullanılır. Bu sayede frontend direkt bu görünümlerden veri çekebilir.
