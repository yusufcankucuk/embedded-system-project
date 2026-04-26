import { supabase } from '@/lib/supabase';
import { Building2, Plus, MapPin, Trash2, ArrowRight } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function createSchool(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  
  if (!name) return;

  await supabase.from('schools').insert([{ name, address }]);
  revalidatePath('/school');
}

async function deleteSchool(formData: FormData) {
  'use server';
  const schoolId = formData.get('school_id') as string;
  if (!schoolId) return;

  await supabase.from('sensors').update({ school_id: null, class_id: null }).eq('school_id', schoolId);
  await supabase.from('sensor_data').delete().eq('school_id', schoolId);
  await supabase.from('classrooms').delete().eq('school_id', schoolId);
  const { error } = await supabase.from('schools').delete().eq('id', schoolId);
  if (error) {
    console.error("Failed to delete school:", error.message);
  }
  
  revalidatePath('/school');
  revalidatePath('/admin');
}

export default async function SchoolsPage() {
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Schools</h1>
            <p className="text-slate-500 mt-2 font-medium">Manage registered schools and access their dashboards.</p>
          </div>
          <Link 
            href="/admin" 
            className="text-sm font-medium text-orange-600 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors border border-orange-200"
          >
            Admin Panel
          </Link>
        </header>

        {/* Create School Form */}
        <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
          <div className="flex items-center gap-4 bg-orange-50 px-6 py-4 rounded-2xl w-full md:w-auto">
              <Plus className="text-orange-500" size={32} />
              <div>
                  <h2 className="text-lg font-bold text-orange-700">Register New School</h2>
                  <p className="text-xs text-orange-600/70">Add a new facility to monitor.</p>
              </div>
          </div>
          <form action={createSchool} className="flex-1 flex flex-col md:flex-row gap-3 w-full">
              <input 
                  type="text" 
                  name="name" 
                  required 
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="e.g. Washington High School"
              />
              <input 
                  type="text" 
                  name="address" 
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="City / Address"
              />
              <button 
                  type="submit" 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-all whitespace-nowrap"
              >
                  Save
              </button>
          </form>
        </div>

        {/* Schools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {error ? (
            <div className="p-6 text-red-500 w-full col-span-full">Failed to load schools.</div>
          ) : schools?.length === 0 ? (
            <div className="col-span-full p-12 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-orange-200">
              <Building2 size={48} className="mb-4 opacity-50 text-orange-200" />
              <p className="font-medium">No schools registered in the system yet.</p>
            </div>
          ) : (
            schools?.map((school) => (
              <div key={school.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-orange-100 text-orange-600 p-4 rounded-2xl">
                    <Building2 size={24} />
                  </div>
                  <div className="flex-1 flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black text-slate-800">{school.name}</h3>
                      {school.address && (
                        <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                          <MapPin size={14} className="text-orange-400" />
                          {school.address}
                        </p>
                      )}
                    </div>
                    <form action={deleteSchool}>
                      <input type="hidden" name="school_id" value={school.id} />
                      <button type="submit" className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete School">
                        <Trash2 size={18} />
                      </button>
                    </form>
                  </div>
                </div>

                <Link href={`/school/${school.id}`} className="w-full flex justify-center items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 hover:border-orange-300 font-bold py-3 px-4 rounded-xl shadow-sm transition-all">
                    <ArrowRight size={18} /> Enter Dashboard
                </Link>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
