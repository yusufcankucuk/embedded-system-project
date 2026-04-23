// ============================================================
// Veritabanı tablo tipleri — PROJECT_PLAN.md şemasına göre
// ============================================================

export type SensorType = 'indoor' | 'outdoor'
export type Co2Status = 'ok' | 'warning' | 'critical'

export interface School {
  id: string
  name: string
  address: string | null
  created_at: string
}

export interface Classroom {
  id: string
  school_id: string
  name: string
  created_at: string
}

export interface Sensor {
  id: string
  name: string
  type: SensorType
  school_id: string | null
  class_id: string | null
  battery: number
  last_seen: string | null
  created_at: string
}

export interface SensorData {
  id: string
  sensor_id: string
  school_id: string
  class_id: string | null
  co2: number
  temp: number
  humidity: number
  battery: number
  timestamp: string
}

// ============================================================
// View tipleri
// ============================================================

export interface ClassroomLiveStatus {
  class_id: string
  class_name: string
  school_id: string
  sensor_id: string
  sensor_name: string
  battery: number
  last_seen: string | null
  co2: number
  temp: number
  humidity: number
  last_reading: string
  co2_status: Co2Status
}

export interface LowBatterySensor {
  id: string
  name: string
  type: SensorType
  battery: number
  last_seen: string | null
  school_name: string | null
}

// ============================================================
// Yardımcı tipler
// ============================================================

export interface Co2ThresholdInfo {
  status: Co2Status
  label: string
  color: string
  bgColor: string
  borderColor: string
}
