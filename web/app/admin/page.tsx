import { supabase } from '@/lib/supabase';
import { AlertCircle, BatteryWarning, CheckCircle2, Flame, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function rechargeSensor(formData: FormData) {
  'use server';
  const sensorId = formData.get('sensor_id') as string;
  if (!sensorId) return;
  await supabase.from('sensors').update({ battery: 100 }).eq('id', sensorId);
  revalidatePath('/admin');
}

export default async function AdminDashboardPage() {
  const { data: unassignedSensors, error: unErr } = await supabase
    .from('unassigned_sensors')
    .select('*');

  const { data: lowBatterySensors, error: lowErr } = await supabase
    .from('low_battery_sensors')
    .select('*');


  const { data: allClasses, error: critErr } = await supabase
    .from('classroom_live_status')
    .select('*');

  const criticalClasses = allClasses?.filter(cls => 
      cls.co2 >= 1500 || 
      cls.temp < 15 || cls.temp > 30 || 
      cls.humidity < 20 || cls.humidity > 70
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Overview Dashboard</h1>
        <p className="text-slate-500 mt-2">Current health status of devices and critical alerts.</p>
      </header>

      {/* Global Critical Alerts Block (Full Width) */}
      {criticalClasses.length > 0 && (
          <div className="bg-red-600 rounded-3xl p-6 shadow-lg shadow-red-200 border border-red-500 text-white animate-pulse-slow">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Flame size={28} className="text-white" />
                  </div>
                  <div>
                      <h2 className="text-2xl font-black">CRITICAL ALERTS DETECTED</h2>
                      <p className="text-red-100 font-medium">Out-of-range parameters registered in the following locations:</p>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {criticalClasses.map(cls => (
                      <div key={cls.class_id} className="bg-white/10 border border-white/20 rounded-2xl p-4 flex justify-between items-center backdrop-blur-sm hover:bg-white/20 transition-colors">
                          <div>
                              <p className="text-xs text-red-200 font-bold uppercase tracking-wider">{cls.school_name} - Classroom</p>
                              <p className="font-bold text-xl">{cls.class_name}</p>
                              <div className="text-sm font-medium mt-1 text-red-100 flex gap-3 flex-wrap">
                                  {cls.co2 >= 1500 && <span className="bg-red-800/50 px-2 rounded">CO2: {cls.co2}</span>}
                                  {(cls.temp < 15 || cls.temp > 30) && <span className="bg-red-800/50 px-2 rounded">Temp: {cls.temp}°C</span>}
                                  {(cls.humidity < 20 || cls.humidity > 70) && <span className="bg-red-800/50 px-2 rounded">Hum: {cls.humidity}%</span>}
                              </div>
                          </div>
                          <Link href={`/school/${cls.school_id}/class/${cls.class_id}`} className="bg-white text-red-600 p-3 rounded-xl shadow-sm hover:shadow-md transition-all">
                              <ArrowRight size={20} />
                          </Link>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Unassigned Sensors */}
        <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Unassigned Sensors</h2>
          </div>
          
          <div className="flex-1">
            {unErr ? (
              <p className="text-red-500">Data fetch error: {unErr.message}</p>
            ) : unassignedSensors && unassignedSensors.length > 0 ? (
              <ul className="space-y-3">
                {unassignedSensors.map((sensor: any) => (
                  <li key={sensor.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-medium text-slate-700">{sensor.name}</p>
                      <p className="text-xs text-orange-500 font-semibold uppercase tracking-wider">{sensor.type}</p>
                    </div>
                    <Link href={`/admin/${sensor.type === 'outdoor' ? 'schools' : 'sensors'}`} className="text-sm font-medium text-orange-600 hover:text-white py-2 px-4 hover:bg-orange-600 border border-orange-200 bg-orange-50 rounded-xl transition-colors">
                      Assign
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <CheckCircle2 size={32} className="mb-2 text-green-400" />
                <p>All sensors are assigned.</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Battery Sensors */}
        <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <BatteryWarning size={24} />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Low Battery ( &lt; 20% )</h2>
          </div>
          
          <div className="flex-1">
            {lowErr ? (
              <p className="text-red-500">Data fetch error: {lowErr.message}</p>
            ) : lowBatterySensors && lowBatterySensors.length > 0 ? (
              <ul className="space-y-3">
                {lowBatterySensors.map((sensor: any) => (
                  <li key={sensor.id} className="flex justify-between items-center bg-red-50/50 p-4 rounded-2xl border border-red-100">
                    <div>
                      <p className="font-medium text-slate-800">{sensor.name}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Facility: {sensor.school_name || 'None'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-red-700 font-black bg-white px-3 py-1.5 rounded-xl shadow-sm">{sensor.battery}%</span>
                       <form action={rechargeSensor}>
                          <input type="hidden" name="sensor_id" value={sensor.id} />
                          <button type="submit" className="text-xs font-bold text-white bg-green-500 hover:bg-green-600 px-3 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1">
                              <Zap size={14} /> Recharge
                          </button>
                       </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <CheckCircle2 size={32} className="mb-2 text-green-400" />
                <p>All batteries are in good condition.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
