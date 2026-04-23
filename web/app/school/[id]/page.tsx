import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { CloudRain, DoorOpen, Plus, Link as LinkIcon, Home, MapPin, Activity, Flame, ArrowRight } from 'lucide-react';

import OutdoorChart from '@/components/ui/OutdoorChart';

export const dynamic = 'force-dynamic';

async function createClassroom(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const schoolId = formData.get('school_id') as string;
  
  if (!name || !schoolId) return;

  await supabase.from('classrooms').insert([{ name, school_id: schoolId }]);
  revalidatePath(`/school/${schoolId}`);
}

async function assignSensorToClass(formData: FormData) {
  'use server';
  const sensorId = formData.get('sensor_id') as string;
  const classId = formData.get('class_id') as string;
  const schoolId = formData.get('school_id') as string;
  
  if (!sensorId || !classId) return;

  await supabase
    .from('sensors')
    .update({ class_id: classId, school_id: schoolId })
    .eq('id', sensorId);

  revalidatePath(`/school/${schoolId}`);
  revalidatePath('/admin');
  revalidatePath('/admin/sensors');
  revalidatePath('/admin/schools');
}

async function bindOutdoorSensor(formData: FormData) {
  'use server';
  const sensorId = formData.get('sensor_id') as string;
  const schoolId = formData.get('school_id') as string;
  
  if (!sensorId || !schoolId) return;

  await supabase
    .from('sensors')
    .update({ school_id: schoolId })
    .eq('id', sensorId);

  revalidatePath(`/school/${schoolId}`);
  revalidatePath('/admin/sensors');
}

export default async function SchoolDashboardPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
  const { id: schoolId } = await params;


  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();

  if (!school) {
    return <div className="p-10 text-center">School not found.</div>;
  }


  const { data: outdoorSensor } = await supabase
    .from('sensors')
    .select('*')
    .eq('school_id', schoolId)
    .eq('type', 'outdoor')
    .limit(1)
    .maybeSingle();

  let outdoorDataHistory: any[] = [];
  if (outdoorSensor) {
    const { data } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('sensor_id', outdoorSensor.id)
      .order('timestamp', { ascending: false })
      .limit(50);
    outdoorDataHistory = data || [];
  }


  const { data: classrooms } = await supabase
    .from('classroom_live_status')
    .select('*')
    .eq('school_id', schoolId);


  const { data: allClassrooms } = await supabase
    .from('classrooms')
    .select('*')
    .eq('school_id', schoolId)
    .order('name');


  const { data: unassignedIndoorSensors } = await supabase
    .from('sensors')
    .select('*')
    .eq('type', 'indoor')
    .is('class_id', null)
    .or(`school_id.is.null,school_id.eq.${schoolId}`);

  const { data: unassignedOutdoorSensors } = await supabase
    .from('sensors')
    .select('*')
    .eq('type', 'outdoor')
    .is('school_id', null);


  const criticalClasses = classrooms?.filter(cls => 
      cls.co2 >= 1500 || 
      cls.temp < 15 || cls.temp > 30 || 
      cls.humidity < 20 || cls.humidity > 70
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Critical Overviews specific to this school */}
        {criticalClasses.length > 0 && (
            <div className="bg-red-600 rounded-3xl p-6 shadow-lg shadow-red-200 border border-red-500 text-white animate-pulse-slow">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Flame size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black">ENVIRONMENTAL HAZARD</h2>
                        <p className="text-red-100 font-medium">Critical metrics detected in these classrooms:</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-6">
                    {criticalClasses.map(cls => (
                        <Link href={`/school/${schoolId}/class/${cls.class_id}`} key={cls.class_id} className="bg-white/10 border border-white/20 rounded-2xl p-4 flex gap-4 items-center backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer">
                            <div>
                                <p className="font-bold text-xl">{cls.class_name}</p>
                                <div className="text-sm font-medium mt-1 text-red-100 flex gap-2 flex-wrap">
                                  {cls.co2 >= 1500 && <span className="bg-red-800/50 px-2 rounded">CO2: {cls.co2}</span>}
                                  {(cls.temp < 15 || cls.temp > 30) && <span className="bg-red-800/50 px-2 rounded">Temp: {cls.temp}°C</span>}
                                  {(cls.humidity < 20 || cls.humidity > 70) && <span className="bg-red-800/50 px-2 rounded">Hum: {cls.humidity}%</span>}
                                </div>
                            </div>
                            <div className="bg-white text-red-600 p-2 rounded-xl shadow-sm">
                              <ArrowRight size={20} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        )}

        {/* Header Block */}
        <div className="bg-white rounded-3xl border border-orange-100 p-8 shadow-sm flex flex-col md:flex-row md:justify-between md:items-stretch gap-6 relative overflow-hidden">
            
            <div className="flex flex-col justify-between z-10 w-full md:w-1/2 flex-1">
                <div>
                    <Link href="/admin/schools" className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg mb-4 hover:bg-orange-100 transition-colors w-max">
                        <Home size={16} /> Back to Admin
                    </Link>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                        {school.name}
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                        <MapPin size={16} className="text-orange-400"/> {school.address || "No address provided"}
                    </p>
                </div>
                
                {/* Add Classroom Form */}
                <form action={createClassroom} className="mt-8 flex gap-2 w-full max-w-sm">
                    <input type="hidden" name="school_id" value={schoolId} />
                    <input 
                        type="text" 
                        name="name" 
                        required 
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                        placeholder="New Class (e.g. 5-A)"
                    />
                    <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm">
                        <Plus size={16} /> Add 
                    </button>
                </form>
            </div>
            
            {/* Outdoor Sensor Widget integrated into Header */}
            <div className="w-full md:w-[400px] h-[360px]">
                {outdoorSensor ? (
                    <OutdoorChart 
                        sensorId={outdoorSensor.id} 
                        initialData={outdoorDataHistory}
                        schoolId={schoolId}
                    />
                ) : (
                    <div className="bg-gradient-to-br from-slate-50 to-orange-50/50 rounded-3xl border border-orange-100 p-6 shadow-inner h-full flex flex-col items-center justify-center text-center">
                        <CloudRain size={32} className="mb-2 opacity-30 text-slate-400" />
                        <p className="text-sm text-slate-500 font-medium tracking-wide">No outdoor sensor linked.</p>
                        
                        {unassignedOutdoorSensors && unassignedOutdoorSensors.length > 0 ? (
                            <form action={bindOutdoorSensor} className="mt-4 flex flex-col w-full max-w-xs mx-auto gap-2">
                                <input type="hidden" name="school_id" value={schoolId} />
                                <select name="sensor_id" required className="w-full rounded-lg border border-orange-200 bg-white p-2 text-sm text-slate-700 outline-none shadow-sm cursor-pointer hover:border-orange-300">
                                    <option value="">-- Pick Sensor --</option>
                                    {unassignedOutdoorSensors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 mt-1 rounded-xl text-sm transition-colors shadow-sm">
                                    Bind Outdoor Sensor
                                </button>
                            </form>
                        ) : (
                            <p className="text-xs text-slate-400 mt-2">Create an OUTDOOR sensor in Admin Panel first.</p>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Full Width Classrooms List */}
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                <DoorOpen className="text-orange-500" />
                Classroom Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allClassrooms?.map((cls) => {
                    const liveStatus = classrooms?.find(c => c.class_id === cls.id);
                    
                    let cardStyle = "bg-white border-slate-100";
                    let DotColor = "bg-slate-300";
                    
                    if (liveStatus?.co2_status === 'ok') {
                        cardStyle = "bg-green-50/50 border-green-200";
                        DotColor = "bg-green-500";
                    } else if (liveStatus?.co2_status === 'warning') {
                        cardStyle = "bg-amber-50 border-amber-200";
                        DotColor = "bg-amber-500 animate-pulse";
                    } else if (liveStatus?.co2_status === 'critical') {
                        cardStyle = "bg-red-50 border-red-300 shadow-red-100 shadow-md";
                        DotColor = "bg-red-600 animate-pulse";
                    }
                    
                    return (
                        <div key={cls.id} className={`group rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between min-h-[220px] ${cardStyle}`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-slate-800">{cls.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full shadow-sm ${DotColor}`} />
                                    </div>
                                </div>
                                {liveStatus ? (
                                    <>
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-4xl font-black text-slate-800">{liveStatus.co2}</span>
                                            <span className="text-slate-500 font-medium">ppm</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className={`${liveStatus.co2_status === 'critical' ? 'text-red-700 font-bold' : 'text-slate-500'}`}>
                                                {liveStatus.co2_status === 'critical' ? 'CRITICAL' : liveStatus.co2_status === 'warning' ? 'WARNING' : 'EXCELLENT'}
                                            </span>
                                            <span className="text-slate-500 bg-white/50 px-2 rounded-md font-bold">{liveStatus.temp}°C</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-2 text-sm text-slate-400 italic mb-4">
                                        No active sensor data.
                                    </div>
                                )}
                            </div>

                            {/* Inline Mount Sensor Form */}
                            {!liveStatus && unassignedIndoorSensors && unassignedIndoorSensors.length > 0 && (
                                <form action={assignSensorToClass} className="mt-4 border-t border-slate-200 pt-4 flex flex-col gap-2 relative z-10">
                                    <input type="hidden" name="school_id" value={schoolId} />
                                    <input type="hidden" name="class_id" value={cls.id} />
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Mount Sensor</label>
                                    <div className="flex gap-2">
                                        <select 
                                            name="sensor_id" 
                                            required
                                            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 outline-none"
                                        >
                                            <option value="">-- Choose --</option>
                                            {unassignedIndoorSensors?.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-3 py-2 transition-colors">
                                            <LinkIcon size={14} />
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Dashboard Access Button */}
                            {liveStatus && (
                                <div className="mt-4 pt-4 border-t border-slate-200/50">
                                    <Link href={`/school/${schoolId}/class/${cls.id}`} className={`w-full inline-flex justify-center items-center gap-2 font-bold py-2 rounded-xl transition-colors text-sm ${liveStatus.co2_status === 'critical' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'}`}>
                                        <Activity size={16} className={liveStatus.co2_status === 'critical' ? 'text-white' : 'text-orange-500'}/> {liveStatus.co2_status === 'critical' ? 'ACT NOW' : 'Live Dashboard'}
                                    </Link>
                                </div>
                            )}

                        </div>
                    );
                })}
                
                {allClassrooms?.length === 0 && (
                    <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-dashed border-orange-200">
                        <p className="text-slate-500 font-medium">No classrooms created yet. Use the form above to add one.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
