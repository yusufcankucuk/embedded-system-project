import { supabase } from '@/lib/supabase';
import RealtimeOutdoorDetail from '@/components/ui/RealtimeOutdoorDetail';
import Link from 'next/link';
import { ArrowLeft, CloudRain } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OutdoorDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: schoolId } = await params;


  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .single();

  if (!school) {
    return <div className="p-12 text-center text-slate-500">School does not exist.</div>;
  }


  const { data: sensor } = await supabase
    .from('sensors')
    .select('*')
    .eq('school_id', schoolId)
    .eq('type', 'outdoor')
    .limit(1)
    .maybeSingle();

  if (!sensor) {
    return <div className="p-12 text-center text-slate-500">No outdoor sensor found attached to this school.</div>;
  }


  const { data: initialDataList } = await supabase
    .from('sensor_data')
    .select('*')
    .eq('sensor_id', sensor.id)
    .order('timestamp', { ascending: false })
    .limit(50);

  const initialData = initialDataList || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Navigation header */}
        <Link href={`/school/${schoolId}`} className="inline-flex items-center gap-2 text-sm font-medium text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-lg hover:bg-cyan-100 transition-colors">
          <ArrowLeft size={16} /> Back to {school.name}
        </Link>
        
        <header className="flex flex-col gap-2 border-b border-cyan-100 pb-4">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
               <CloudRain className="text-cyan-500" /> Outdoor Atmosphere Hub
            </h1>
            <p className="text-slate-500 font-medium">Monitoring exterior environmental metrics for broader facility conditioning.</p>
        </header>

        {/* Multi-metric Realtime Panel */}
        <RealtimeOutdoorDetail 
            sensorId={sensor.id} 
            sensorName={sensor.name} 
            initialData={initialData} 
        />
        
      </div>
    </div>
  );
}
