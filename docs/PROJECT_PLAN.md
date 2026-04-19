# Air Quality Monitoring for Schools — Proje Planı

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS + TypeScript |
| Backend / DB | Supabase (PostgreSQL + Realtime) |
| IoT Simülatör | Node.js (bağımsız servis) |

---

## Sistem Mimarisi

```
Sensor Simulator (Node.js)
        │
        │  HTTP POST / Supabase Client
        ▼
  Supabase Database (PostgreSQL)
        │
        │  Realtime Subscriptions + REST API
        ▼
   Next.js Web UI
   ├── Admin Panel
   └── School Dashboard
```

---

## Veritabanı Şeması

### `schools` tablosu
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid (PK) | Okul benzersiz kimliği |
| name | text | Okul adı |
| address | text | Okul adresi |
| created_at | timestamptz | Oluşturulma zamanı |

### `classrooms` tablosu
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid (PK) | Sınıf benzersiz kimliği |
| school_id | uuid (FK → schools.id) | Bağlı olduğu okul |
| name | text | Sınıf adı (örn. "5-A") |
| created_at | timestamptz | Oluşturulma zamanı |

### `sensors` tablosu
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid (PK) | Sensör benzersiz kimliği |
| name | text | Sensör etiketi |
| type | text | `'indoor'` veya `'outdoor'` |
| school_id | uuid (FK → schools.id) | Atanmış okul (nullable) |
| class_id | uuid (FK → classrooms.id) | Atanmış sınıf (sadece indoor, nullable) |
| battery | integer | Anlık batarya yüzdesi (0–100) |
| last_seen | timestamptz | Son veri gönderim zamanı |
| created_at | timestamptz | Oluşturulma zamanı |

### `sensor_data` tablosu
| Kolon | Tip | Açıklama |
|---|---|---|
| id | uuid (PK) | Kayıt benzersiz kimliği |
| sensor_id | uuid (FK → sensors.id) | Veriyi gönderen sensör |
| school_id | uuid (FK → schools.id) | Ait olduğu okul |
| class_id | uuid (FK → classrooms.id) | Ait olduğu sınıf (nullable) |
| co2 | integer | CO₂ değeri (ppm) |
| temp | numeric(4,1) | Sıcaklık (°C) |
| humidity | integer | Nem yüzdesi (%) |
| battery | integer | Batarya yüzdesi (%) |
| timestamp | timestamptz | Ölçüm zamanı |

---

## Sensör Tipleri

- **Indoor**: Bir sınıfa (`class_id`) atanır. CO₂, sıcaklık, nem ölçer.
- **Outdoor**: Doğrudan okula (`school_id`) atanır, `class_id` boş kalır.

---

## Eşik Değerler (Thresholds)

### CO₂ (ppm)
| Durum | Aralık | Renk |
|---|---|---|
| OK | < 1000 ppm | Yeşil |
| Warning | 1000 – 1500 ppm | Sarı |
| Critical | > 1500 ppm | Kırmızı |

### Batarya
| Durum | Eşik | Renk |
|---|---|---|
| Low Battery | < %20 | Turuncu/Kırmızı |

---

## Veri Paketi (IoT → Supabase)

Simülatörün her ölçüm döngüsünde göndereceği JSON yapısı:

```json
{
  "sensor_id": "uuid",
  "type": "indoor | outdoor",
  "school_id": "uuid",
  "class_id": "uuid | null",
  "co2": 850,
  "temp": 21.5,
  "humidity": 45,
  "battery": 87,
  "timestamp": "2026-03-16T10:00:00Z"
}
```

---

## Admin Paneli (Zorunlu Özellikler)

- Yeni okul oluştur
- Yeni sensör oluştur (`indoor` / `outdoor`)
- Sensörü okula ata; indoor sensörü sınıfa ata
- Atanmamış sensörleri listele (school_id NULL)
- Şarjı az sensörleri listele (battery < 20)

---

## Okul Paneli / School Dashboard (Zorunlu Özellikler)

- Sınıf oluştur
- Okula ait indoor sensörünü sınıfa ata
- Canlı sınıf durumunu renklendirmelerle göster (OK / Warning / Critical)
- Sınıf detay sayfasında:
  - Zaman serisi CO₂ / sıcaklık / nem grafikleri
  - Sensörün son görülme zamanı (`last_seen`)
- Dış mekan sensörünü (outdoor) ayrı bir alanda göster
