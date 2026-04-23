import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-gray-900">
          Air Quality Monitoring
        </h1>
        <p className="text-gray-500 text-lg">Okul Hava Kalitesi İzleme Sistemi</p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin"
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Admin Paneli
        </Link>
        <Link
          href="/school"
          className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Okul Paneli
        </Link>
      </div>
    </main>
  )
}
