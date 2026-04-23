"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CloudRain, Activity } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type OutdoorData = {
  co2: number;
  temp: number;
  humidity: number;
  battery: number;
  timestamp: string;
};

export default function OutdoorChart({
  sensorId,
  initialData,
  schoolId,
}: {
  sensorId: string;
  initialData: OutdoorData[];
  schoolId?: string;
}) {

  const [dataHistory, setDataHistory] = useState<OutdoorData[]>(initialData.reverse());
  const [current, setCurrent] = useState<OutdoorData | null>(initialData[initialData.length - 1] || null);

  useEffect(() => {
    if (!sensorId) return;

    const channel = supabase
      .channel(`outdoor_${sensorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_data",
          filter: `sensor_id=eq.${sensorId}`,
        },
        (payload) => {
          const newRecord = payload.new as OutdoorData;
          setCurrent(newRecord);
          setDataHistory((prev) => {
            const updated = [...prev, newRecord];
            if (updated.length > 50) return updated.slice(updated.length - 50);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sensorId]);

  if (!current) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-cyan-50/50 rounded-3xl p-6 border border-cyan-100 shadow-inner h-full flex flex-col items-center justify-center text-center">
         <CloudRain size={32} className="text-cyan-300 mb-2 opacity-50" />
         <h2 className="font-bold text-slate-700 text-sm">Outdoor Status</h2>
         <p className="text-slate-400 text-xs mt-1">Awaiting environmental metrics...</p>
      </div>
    );
  }

  const chartColor = "#06b6d4"; // cyan-500

  const formattedData = dataHistory.map((d) => ({
    ...d,
    timeLabel: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }));

  return (
    <div className="bg-gradient-to-br flex flex-col justify-between from-slate-50 to-cyan-50/30 rounded-3xl p-6 border border-cyan-100 shadow-inner w-full min-h-[300px]">
        {/* Header Strings */}
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 uppercase tracking-wider">
                <CloudRain className="text-cyan-500" size={18}/> Outdoor Air Quality
            </h3>
            <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500 font-medium">Battery: {current.battery}%</span>
        </div>
        
        {/* Number Blocks */}
        <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100/50 relative overflow-hidden group hover:border-cyan-200 transition-colors">
                <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity size={48} className="text-cyan-500"/>
                </div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">CO2</p>
                <div className="flex justify-center items-baseline gap-1">
                    <p className="font-black text-slate-800 text-2xl">{current.co2}</p>
                    <span className="text-[10px] font-bold text-slate-400">ppm</span>
                </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100/50">
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Temperature</p>
                <div className="flex justify-center items-baseline gap-1">
                    <p className="font-black text-slate-800 text-2xl">{current.temp}</p>
                    <span className="text-[10px] font-bold text-slate-400">°C</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100/50">
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Humidity</p>
                <div className="flex justify-center items-baseline gap-1">
                    <p className="font-black text-slate-800 text-2xl">{current.humidity}</p>
                    <span className="text-[10px] font-bold text-slate-400">%</span>
                </div>
            </div>
        </div>

        {/* Live Area Chart */}
        <div className="h-32 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOutdoorCo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="co2" 
                  stroke={chartColor} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorOutdoorCo2)" 
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
        </div>
        
        {/* Detail Link Button */}
        {schoolId && (
            <a href={`/school/${schoolId}/outdoor`} className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 flex items-center justify-center gap-2 rounded-xl transition-colors shadow-sm">
                <Activity size={18} /> Live Outdoor Dashboard
            </a>
        )}
    </div>
  );
}
