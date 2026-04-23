import { supabase } from '@/lib/supabase';
import RealtimeClassroom from '@/components/ui/RealtimeClassroom';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClassroomPage({
  params
}: {
  params: Promise<{ id: string; classId: string }>
}) {

  const { id: schoolId, classId } = await params;


  const { data: classroom } = await supabase
    .from('classrooms')
    .select('*, schools(name)')
    .eq('id', classId)
    .single();

  if (!classroom) {
    return <div className="p-10 text-center text-red-500">Classroom not found.</div>;
  }


  const { data: sensor } = await supabase
    .from('sensors')
    .select('*')
    .eq('class_id', classId)
    .single();


  let initialData: any[] = [];
  if (sensor) {
    const { data } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('sensor_id', sensor.id)
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (data) initialData = data;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Navigation / Breadcrumbs */}
        <Link 
            href={`/school/${schoolId}`} 
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 font-medium bg-orange-50 px-4 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft size={18} />
          Back to {classroom.schools?.name}
        </Link>

        {/* Title */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                    Class {classroom.name}
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Realtime Environment Dashboard</p>
            </div>
        </div>

        {/* Content */}
        {!sensor ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-orange-200">
            <h2 className="text-xl font-bold text-slate-700">No Sensor Assigned</h2>
            <p className="text-slate-500 mt-2">There is no indoor sensor protecting this classroom yet.</p>
            <p className="text-sm text-slate-400 mt-4">Please assign an indoor sensor via the School Dashboard or Admin Panel.</p>
          </div>
        ) : (
          <RealtimeClassroom 
            classId={classId} 
            initialData={initialData} 
            sensorName={sensor.name} 
          />
        )}
      </div>
    </div>
  );
}
