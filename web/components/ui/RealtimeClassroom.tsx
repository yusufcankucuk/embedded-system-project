"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Thermometer, Droplets, BatteryMedium, AlertTriangle } from "lucide-react";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ClassroomData = {
  co2: number;
  temp: number;
  humidity: number;
  battery: number;
  timestamp: string;
};

export default function RealtimeClassroom({
  classId,
  initialData,
  sensorName
}: {
  classId: string;
  initialData: ClassroomData[];
  sensorName: string;
}) {
  const [dataHistory, setDataHistory] = useState<ClassroomData[]>(initialData.reverse());
  const [current, setCurrent] = useState<ClassroomData | null>(initialData[initialData.length - 1] || null);

  useEffect(() => {

    const channel = supabase
      .channel(`classroom_${classId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_data",
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          const newRecord = payload.new as ClassroomData;
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
  }, [classId]);

  if (!current) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-orange-100 flex flex-col items-center justify-center">
         <AlertTriangle size={48} className="text-orange-300 mb-4" />
         <h2 className="text-xl font-bold text-slate-700">No Data Available</h2>
         <p className="text-slate-500 mt-2">Waiting for the sensor to transmit data...</p>
      </div>
    );
  }


  let statusColor = "bg-green-100 text-green-700 border-green-200";
  let statusText = "OK";
  let chartColor = "#22c55e"; // green
  if (current.co2 >= 1000 && current.co2 < 1500) {
    statusColor = "bg-amber-100 text-amber-700 border-amber-200";
    statusText = "WARNING";
    chartColor = "#f59e0b"; // amber
  } else if (current.co2 >= 1500) {
    statusColor = "bg-red-100 text-red-700 border-red-200";
    statusText = "CRITICAL";
    chartColor = "#ef4444"; // red
  }


  const formattedData = dataHistory.map((d) => ({
    ...d,
    timeLabel: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }));

  const co2Color = current.co2 >= 1500 ? '#dc2626' : current.co2 >= 1000 ? '#d97706' : '#16a34a';
  const tempColor = (current.temp < 15 || current.temp > 30) ? '#dc2626' : (current.temp < 18 || current.temp > 26) ? '#d97706' : '#16a34a';
  const humColor = (current.humidity < 20 || current.humidity > 70) ? '#dc2626' : (current.humidity < 30 || current.humidity > 60) ? '#d97706' : '#16a34a';

  return (
    <div className="space-y-8">
      {/* Live Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* CO2 Main Card */}
        <div className={`md:col-span-2 rounded-3xl p-6 border shadow-sm flex flex-col justify-between transition-colors duration-500 opacity-95 ${statusColor}`}>
          <div className="flex justify-between items-start">
            <h3 className="font-bold uppercase tracking-wider text-sm opacity-80 flex items-center gap-2">
              <Activity size={16} /> CO2 Level
            </h3>
            <span className="px-3 py-1 bg-white/50 rounded-full font-bold text-xs shadow-sm">
              {statusText}
            </span>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-6xl font-black">{current.co2}</span>
            <span className="text-xl font-bold opacity-75">ppm</span>
          </div>
        </div>

        {/* Temp Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-sm flex items-center gap-2">
              <Thermometer size={16} className="text-orange-500" /> Temperature
            </h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800">{current.temp}</span>
              <span className="text-lg font-bold text-slate-400">°C</span>
            </div>
        </div>

        {/* Humidity Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-sm flex items-center gap-2">
              <Droplets size={16} className="text-blue-500" /> Humidity
            </h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800">{current.humidity}</span>
              <span className="text-lg font-bold text-slate-400">%</span>
            </div>
        </div>

      </div>

      {/* Big CO2 Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-slate-100 pb-4">
               Live CO2 Saturation
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedData}>
                    <defs>
                      <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={co2Color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={co2Color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="timeLabel" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      domain={[400, 'auto']} 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="co2" 
                      stroke={co2Color} 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorCo2)" 
                      animationDuration={300}
                    />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Medium Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Temp Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-slate-100 pb-4">
                   Temperature Trends
                </h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formattedData}>
                        <defs>
                          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="timeLabel" hide={true} />
                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dx={-10} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                        <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" animationDuration={300} />
                      </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Hum Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-slate-100 pb-4">
                   Humidity Patterns
                </h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formattedData}>
                        <defs>
                          <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="timeLabel" hide={true} />
                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dx={-10} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                        <Area type="monotone" dataKey="humidity" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorHum)" animationDuration={300} />
                      </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    </div>
  );
}
