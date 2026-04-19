-- ============================================================
-- Air Quality Monitoring for Schools — Supabase SQL Schema
-- Supabase SQL Editor'e kopyalayıp çalıştırın.
-- ============================================================

-- uuid_generate_v4() için gerekli extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SCHOOLS
-- ============================================================
CREATE TABLE schools (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  address    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE schools IS 'Sisteme kayıtlı okullar';

-- ============================================================
-- 2. CLASSROOMS
-- ============================================================
CREATE TABLE classrooms (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE classrooms IS 'Okullara ait sınıflar';

CREATE INDEX idx_classrooms_school_id ON classrooms(school_id);

-- ============================================================
-- 3. SENSORS
-- ============================================================
CREATE TYPE sensor_type AS ENUM ('indoor', 'outdoor');

CREATE TABLE sensors (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  type       sensor_type NOT NULL,
  school_id  UUID REFERENCES schools(id) ON DELETE SET NULL,
  class_id   UUID REFERENCES classrooms(id) ON DELETE SET NULL,
  battery    INTEGER NOT NULL DEFAULT 100 CHECK (battery BETWEEN 0 AND 100),
  last_seen  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- İş kuralı: outdoor sensörün class_id'si olamaz
  CONSTRAINT chk_outdoor_no_class
    CHECK (type != 'outdoor' OR class_id IS NULL),

  -- İş kuralı: indoor sensör bir okula atanmışsa class_id o okula ait olmalı
  -- (uygulama katmanında da doğrulanır)
  CONSTRAINT chk_indoor_needs_school
    CHECK (type != 'indoor' OR school_id IS NOT NULL OR class_id IS NULL)
);

COMMENT ON TABLE  sensors          IS 'Kayıtlı IoT hava kalitesi sensörleri';
COMMENT ON COLUMN sensors.type     IS 'indoor: sınıfa atanır | outdoor: okula atanır';
COMMENT ON COLUMN sensors.battery  IS 'Anlık batarya yüzdesi (0-100). <20 → Low Battery uyarısı';
COMMENT ON COLUMN sensors.last_seen IS 'Sensörden son veri alınan zaman';

CREATE INDEX idx_sensors_school_id ON sensors(school_id);
CREATE INDEX idx_sensors_class_id  ON sensors(class_id);
CREATE INDEX idx_sensors_type      ON sensors(type);

-- ============================================================
-- 4. SENSOR_DATA
-- ============================================================
CREATE TABLE sensor_data (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_id  UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id   UUID REFERENCES classrooms(id) ON DELETE SET NULL,
  co2        INTEGER      NOT NULL CHECK (co2 >= 0),
  temp       NUMERIC(4,1) NOT NULL,
  humidity   INTEGER      NOT NULL CHECK (humidity BETWEEN 0 AND 100),
  battery    INTEGER      NOT NULL CHECK (battery BETWEEN 0 AND 100),
  timestamp  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  sensor_data         IS 'Sensörlerden gelen ham ölçüm verileri';
COMMENT ON COLUMN sensor_data.co2     IS 'CO₂ (ppm): <1000 OK | 1000-1500 Warning | >1500 Critical';
COMMENT ON COLUMN sensor_data.temp    IS 'Sıcaklık °C';
COMMENT ON COLUMN sensor_data.humidity IS 'Bağıl nem %';

-- Zaman serisi sorguları için kritik index
CREATE INDEX idx_sensor_data_sensor_id  ON sensor_data(sensor_id);
CREATE INDEX idx_sensor_data_school_id  ON sensor_data(school_id);
CREATE INDEX idx_sensor_data_class_id   ON sensor_data(class_id);
CREATE INDEX idx_sensor_data_timestamp  ON sensor_data(timestamp DESC);

-- ============================================================
-- 5. TRIGGER — Sensör last_seen ve battery otomatik güncelleme
-- Her yeni sensor_data satırı eklendiğinde sensors tablosunu günceller.
-- ============================================================
CREATE OR REPLACE FUNCTION update_sensor_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sensors
  SET
    last_seen = NEW.timestamp,
    battery   = NEW.battery
  WHERE id = NEW.sensor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_sensor_last_seen
  AFTER INSERT ON sensor_data
  FOR EACH ROW
  EXECUTE FUNCTION update_sensor_last_seen();

-- ============================================================
-- 6. VIEWS — Admin ve Dashboard için hazır sorgular
-- ============================================================

-- Atanmamış sensörler (Admin Panel listesi)
CREATE OR REPLACE VIEW unassigned_sensors AS
SELECT id, name, type, battery, last_seen, created_at
FROM sensors
WHERE school_id IS NULL;

-- Şarjı az sensörler (Admin Panel listesi)
CREATE OR REPLACE VIEW low_battery_sensors AS
SELECT
  s.id,
  s.name,
  s.type,
  s.battery,
  s.last_seen,
  sc.name AS school_name
FROM sensors s
LEFT JOIN schools sc ON sc.id = s.school_id
WHERE s.battery < 20;

-- Sınıfların anlık durumu (School Dashboard)
-- Her sınıf için en son sensör verisini getirir + CO₂ eşik durumu
CREATE OR REPLACE VIEW classroom_live_status AS
SELECT DISTINCT ON (sd.class_id)
  c.id          AS class_id,
  c.name        AS class_name,
  c.school_id,
  s.id          AS sensor_id,
  s.name        AS sensor_name,
  s.battery,
  s.last_seen,
  sd.co2,
  sd.temp,
  sd.humidity,
  sd.timestamp  AS last_reading,
  CASE
    WHEN sd.co2 < 1000             THEN 'ok'
    WHEN sd.co2 BETWEEN 1000 AND 1500 THEN 'warning'
    ELSE                                'critical'
  END           AS co2_status
FROM classrooms c
JOIN sensors s        ON s.class_id = c.id
JOIN sensor_data sd   ON sd.sensor_id = s.id
ORDER BY sd.class_id, sd.timestamp DESC;

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) — Temel yapı
-- Supabase Dashboard'da Auth > Policies üzerinden genişletin.
-- ============================================================
ALTER TABLE schools      ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data  ENABLE ROW LEVEL SECURITY;

-- Herkese okuma izni (geliştirme aşaması için — production'da daraltın)
CREATE POLICY "public_read_schools"     ON schools     FOR SELECT USING (true);
CREATE POLICY "public_read_classrooms"  ON classrooms  FOR SELECT USING (true);
CREATE POLICY "public_read_sensors"     ON sensors     FOR SELECT USING (true);
CREATE POLICY "public_read_sensor_data" ON sensor_data FOR SELECT USING (true);

-- Yazma izni (simülatör ve admin için — production'da service_role ile kısıtlayın)
CREATE POLICY "allow_insert_sensor_data" ON sensor_data FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_insert_sensors"     ON sensors     FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_sensors"     ON sensors     FOR UPDATE USING (true);
CREATE POLICY "allow_delete_sensors"     ON sensors     FOR DELETE USING (true);
CREATE POLICY "allow_insert_schools"     ON schools     FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_insert_classrooms"  ON classrooms  FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_sensor_data" ON sensor_data FOR DELETE USING (true);

-- ============================================================
-- 8. REALTIME — Dashboard için subscription aktifleştirme
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_data;
ALTER PUBLICATION supabase_realtime ADD TABLE sensors;
