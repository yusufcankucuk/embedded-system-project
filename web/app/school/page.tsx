import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';

export default function SchoolIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-12 rounded-3xl shadow-lg border border-orange-100 flex flex-col items-center max-w-md text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <Building2 size={40} className="text-orange-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">School Dashboard</h1>
        <p className="text-slate-500 mb-8">
          To view a specific school's Realtime Dashboard, you need to select a school from the Admin panel first.
        </p>
        <Link 
          href="/admin/schools" 
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          Go to Schools List <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
