import { supabase } from '@/lib/supabase';
import { RadioReceiver, Activity, Check, AlertTriangle, Trash2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import SensorActionButtons from '@/components/ui/SensorActionButtons';

export const dynamic = 'force-dynamic';



async function createSensor(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  
  if (!name || (type !== 'indoor' && type !== 'outdoor')) return;

  const { data: existing } = await supabase
    .from('sensors')
    .select('id')
    .ilike('name', name)
    .limit(1);

  if (existing && existing.length > 0) {
     redirect('/admin/sensors?error=duplicateName');
  }

  await supabase.from('sensors').insert([{ name, type }]);
  revalidatePath('/admin/sensors');
  revalidatePath('/admin');
  revalidatePath('/school');
  redirect('/admin/sensors');
}

async function manageSensorAction(formData: FormData) {
  'use server';
  const id = formData.get('sensor_id') as string;
  const actionType = formData.get('action_type') as string;
  
  if (!id) return;
  
  if (actionType === 'unbind') {
      await supabase.from('sensors').update({ class_id: null, school_id: null }).eq('id', id);
  } else if (actionType === 'delete') {

      await supabase.from('sensor_data').delete().eq('sensor_id', id);
      await supabase.from('sensors').delete().eq('id', id);
  }

  revalidatePath('/admin/sensors');
  revalidatePath('/admin');
  revalidatePath('/school');
}

export default async function SensorsAdminPage({
    searchParams
}: {
    searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams;

  const { data: sensors } = await supabase
    .from('sensors')
    .select('*, schools(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end border-b border-orange-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Sensor Fleet</h1>
          <p className="text-slate-500 mt-2">Create new IoT devices. (To link them, visit the School Dashboard directly).</p>
        </div>
      </header>

      {error === 'duplicateName' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-200 font-bold flex items-center gap-3">
              <AlertTriangle size={20} /> Ouch! A sensor with this name already exists in the fleet. Please choose a unique name.
          </div>
      )}

      {/* Top Header Block for Creating a Sensor */}
      <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="flex items-center gap-4 bg-orange-50 px-6 py-4 rounded-2xl w-full md:w-auto">
            <Activity className="text-orange-500" size={32} />
            <div>
                <h2 className="text-lg font-bold text-orange-700">Register Device</h2>
                <p className="text-xs text-orange-600/70">Add a physical hardware entity.</p>
            </div>
        </div>
        <form action={createSensor} className="flex-1 flex flex-col md:flex-row gap-3 w-full">
            <input 
                type="text" 
                name="name" 
                required 
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="Device Label (e.g. SN-Floor1-001)"
            />
            <select 
                name="type" 
                required
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            >
                <option value="indoor">Indoor (Classrooms)</option>
                <option value="outdoor">Outdoor (Schoolyard)</option>
            </select>
            <button 
                type="submit" 
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-all whitespace-nowrap"
            >
                Add Sensor
            </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-orange-100 text-slate-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Sensor Details</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Battery</th>
                <th className="p-4 font-semibold">Assignment</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sensors?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No sensors registered.</td>
                </tr>
              )}
              {sensors?.map((sensor) => (
                <tr key={sensor.id} className="hover:bg-orange-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <RadioReceiver size={18} className="text-orange-500" />
                      <span className="font-medium text-slate-800">{sensor.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1 w-48 truncate" title={sensor.id}>{sensor.id}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${sensor.type === 'indoor' ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                      {sensor.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <span className="text-sm text-slate-600 font-medium">{sensor.battery}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {sensor.school_id ? (
                      <div className="flex items-center gap-1 text-sm text-slate-700 font-medium">
                        <Check size={16} className="text-green-500" />
                        {sensor.schools?.name}
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-amber-500 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1 w-max">
                          <AlertTriangle size={14}/>
                          Unassigned
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                      <form action={manageSensorAction}>
                          <input type="hidden" name="sensor_id" value={sensor.id} />
                          <SensorActionButtons isAssigned={!!sensor.school_id} />
                      </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
