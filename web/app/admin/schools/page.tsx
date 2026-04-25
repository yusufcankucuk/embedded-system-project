import { supabase } from '@/lib/supabase';
import { Building2, Plus, MapPin, Link as LinkIcon, Trash2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function createSchool(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  
  if (!name) return;

  await supabase.from('schools').insert([{ name, address }]);
  revalidatePath('/admin/schools');
}

async function deleteSchool(formData: FormData) {
  'use server';
  const schoolId = formData.get('school_id') as string;
  if (!schoolId) return;

  // 1. Okuldaki tüm sensörlerin (indoor/outdoor) okulla ve sınıfla bağını kopar
  await supabase.from('sensors').update({ school_id: null, class_id: null }).eq('school_id', schoolId);

  // 2. Bu okula ait tüm geçmiş sensör verilerini sil
  await supabase.from('sensor_data').delete().eq('school_id', schoolId);

  // 3. Okula bağlı tüm sınıfları sil
  await supabase.from('classrooms').delete().eq('school_id', schoolId);

  // 4. En son okulu sil
  const { error } = await supabase.from('schools').delete().eq('id', schoolId);
  if (error) {
    console.error("Failed to delete school:", error.message);
  }
  
  revalidatePath('/admin/schools');
  revalidatePath('/admin');
}

async function assignSensorToSchool(formData: FormData) {
  'use server';
  const sensorId = formData.get('sensor_id') as string;
  const schoolId = formData.get('school_id') as string;
  
  if (!sensorId || !schoolId) return;

  await supabase
    .from('sensors')
    .update({ school_id: schoolId })
    .eq('id', sensorId);

  revalidatePath('/admin/schools');
  revalidatePath('/admin');
  revalidatePath('/admin/sensors');
}

export default async function SchoolsAdminPage() {
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false });


  const { data: unassignedSensors } = await supabase
    .from('sensors')
    .select('*')
    .is('school_id', null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end border-b border-orange-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Schools Management</h1>
          <p className="text-slate-500 mt-2">Manage registered schools and assign fleet devices directly to blocks.</p>
        </div>
      </header>

      {/* Top Header Block for Creating a School */}
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
                    <div className="mt-2 text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded inline-block">ID: {school.id}</div>
                  </div>
                  <form action={deleteSchool}>
                    <input type="hidden" name="school_id" value={school.id} />
                    <button type="submit" className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete School">
                      <Trash2 size={18} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Action Area within the School Block */}
              <div className="space-y-3">
                  
                  {/* Inline Form to Attach a Sensor */}
                  {unassignedSensors && unassignedSensors.length > 0 ? (
                      <form action={assignSensorToSchool} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-end gap-2">
                          <input type="hidden" name="school_id" value={school.id} />
                          <div className="flex-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 block">Assign Unowned Sensor</label>
                              <select 
                                  name="sensor_id" 
                                  required
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none"
                              >
                                  <option value="">-- Attach Device --</option>
                                  {unassignedSensors.map(s => (
                                      <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                                  ))}
                              </select>
                          </div>
                          <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                            <LinkIcon size={14}/> Bind
                          </button>
                      </form>
                  ) : (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-400 flex items-center gap-2">
                        <LinkIcon size={14} className="text-slate-300"/> No unassigned sensors available in system.
                      </div>
                  )}

                  <Link href={`/school/${school.id}`} className="w-full flex justify-center items-center bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 hover:border-orange-300 font-bold py-3 px-4 rounded-xl shadow-sm transition-all">
                      Enter School Dashboard
                  </Link>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
