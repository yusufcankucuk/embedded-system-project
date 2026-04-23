import type { Co2Status, Co2ThresholdInfo } from '@/types'

// PROJECT_PLAN.md eşik değerlerine göre
export function getCo2Status(ppm: number): Co2Status {
  if (ppm < 1000) return 'ok'
  if (ppm <= 1500) return 'warning'
  return 'critical'
}

export function getCo2Info(ppm: number): Co2ThresholdInfo {
  const status = getCo2Status(ppm)

  const map: Record<Co2Status, Co2ThresholdInfo> = {
    ok: {
      status: 'ok',
      label: 'İyi',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
    },
    warning: {
      status: 'warning',
      label: 'Uyarı',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
    },
    critical: {
      status: 'critical',
      label: 'Kritik',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
    },
  }

  return map[status]
}

export function isLowBattery(battery: number): boolean {
  return battery < 20
}

export function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'Hiç bağlanmadı'
  const diff = Date.now() - new Date(lastSeen).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Az önce'
  if (minutes < 60) return `${minutes} dakika önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} saat önce`
  return `${Math.floor(hours / 24)} gün önce`
}
