import Link from 'next/link';
import { LayoutDashboard, School, RadioReceiver, ServerIcon } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-orange-100 flex flex-col pt-6 shadow-sm">
        <div className="px-6 mb-8">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600">
            Admin Panel
          </h2>
        </div>
        
        <nav className="flex flex-col gap-2 px-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-slate-700 font-medium hover:text-orange-600">
            <LayoutDashboard className="w-5 h-5 text-orange-500" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/schools" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-slate-700 font-medium hover:text-orange-600">
            <School className="w-5 h-5 text-orange-500" />
            <span>Schools</span>
          </Link>
          <Link href="/admin/sensors" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-slate-700 font-medium hover:text-orange-600">
            <RadioReceiver className="w-5 h-5 text-orange-500" />
            <span>Sensor Management</span>
          </Link>
          <Link href="/simulator" className="flex items-center gap-3 px-4 py-3 mt-4 rounded-xl bg-orange-100 border border-orange-200 hover:bg-orange-200 transition-colors text-orange-700 font-bold hover:text-orange-800 shadow-sm">
            <ServerIcon className="w-5 h-5 text-orange-600 animate-pulse" />
            <span>Simulator Control</span>
          </Link>
        </nav>
        
        <div className="mt-auto p-6 text-xs text-slate-400">
          Air Quality Monitoring &copy; 2026
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10 bg-white/50">
        <div className="max-w-6xl mx-auto backdrop-blur-md bg-white p-8 rounded-3xl border border-orange-100 shadow-lg min-h-[85vh]">
          {children}
        </div>
      </main>
    </div>
  );
}
