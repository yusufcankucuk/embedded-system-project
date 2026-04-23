"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SensorData = {
  co2: number;
  temp: number;
  humidity: number;
  battery: number;
  timestamp: string;
};

export default function RealtimeOutdoorDetail({
  sensorId,
  sensorName,
  initialData,
}: {
  sensorId: string;
  sensorName: string;
  initialData: SensorData[];
}) {
  const [dataHistory, setDataHistory] = useState<SensorData[]>(initialData.reverse());
  const [current, setCurrent] = useState<SensorData | null>(initialData[initialData.length - 1] || null);

  useEffect(() => {
    if (!sensorId) return;

    const channel = supabase
      .channel(`outdoor_detail_${sensorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_data",
          filter: `sensor_id=eq.${sensorId}`,
        },
        (payload) => {
          const newRecord = payload.new as SensorData;
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
      <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-100 shadow-sm">
        Waiting for telemetry link to atmospheric probe...
      </div>
    );
  }

  const formattedData = dataHistory.map((d) => ({
    ...d,
    timeLabel: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }));

  const co2Color = '#06b6d4'; // cyan-500
  const tempColor = '#3b82f6'; // blue-500
  const humColor = '#8b5cf6'; // violet-500

  return (
    <div className="space-y-6">
        
        {/* Main Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`bg-gradient-to-br from-cyan-50 to-white rounded-3xl p-6 border border-cyan-100 shadow-sm`}>
                <p className="text-xs text-cyan-600 font-bold mb-1 uppercase tracking-wider">Atmospheric CO2</p>
                <div className="flex items-baseline gap-2">
                    <p className={`font-black text-3xl text-cyan-700`}>{current.co2}</p>
                    <span className="text-xs font-bold text-cyan-500">ppm</span>
                </div>
            </div>
            <div className={`bg-gradient-to-br from-blue-50 to-white rounded-3xl p-6 border border-blue-100 shadow-sm`}>
                <p className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wider">Outside Temp</p>
                <div className="flex items-baseline gap-2">
                    <p className={`font-black text-3xl`} style={{ color: tempColor }}>{current.temp}</p>
                    <span className="text-xs font-bold text-blue-500">°C</span>
                </div>
            </div>
            <div className={`bg-gradient-to-br from-violet-50 to-white rounded-3xl p-6 border border-violet-100 shadow-sm`}>
                <p className="text-xs text-violet-600 font-bold mb-1 uppercase tracking-wider">Outdoor Humidity</p>
                <div className="flex items-baseline gap-2">
                    <p className={`font-black text-3xl`} style={{ color: humColor }}>{current.humidity}</p>
                    <span className="text-xs font-bold text-violet-500">%</span>
                </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Probe Battery</p>
                   <p className="font-black text-2xl text-slate-600">{current.battery}%</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase transition-all duration-300" key={current.timestamp}>LAST PING</p>
                    <p className="text-xs font-mono text-slate-600 font-bold">{new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        </div>

        {/* Big CO2 Chart */}
        <div className="bg-white rounded-3xl p-6 border border-cyan-100 shadow-sm">
            <h3 className="font-bold text-cyan-700 text-sm flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-cyan-50 pb-4">
               Atmospheric CO2 Trend
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedData}>
                    <defs>
                      <linearGradient id="colorOtdCo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={co2Color} stopOpacity={0.6}/>
                        <stop offset="95%" stopColor={co2Color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cffafe" />
                    <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{ fill: '#0891b2', fontSize: 10, fontWeight: 600 }} dy={10} />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#0891b2', fontSize: 10, fontWeight: 600 }} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                    <Area type="monotone" dataKey="co2" stroke={co2Color} strokeWidth={4} fillOpacity={1} fill="url(#colorOtdCo2)" animationDuration={300} />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Medium Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm">
                <h3 className="font-bold text-blue-700 text-sm flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-blue-50 pb-4">
                   Weather Temp
                </h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formattedData}>
                        <defs>
                          <linearGradient id="colorOtdTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={tempColor} stopOpacity={0.5}/>
                            <stop offset="95%" stopColor={tempColor} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbeafe" />
                        <XAxis dataKey="timeLabel" hide />
                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#2563eb', fontSize: 10, fontWeight: 600 }} dx={-10} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                        <Area type="monotone" dataKey="temp" stroke={tempColor} strokeWidth={3} fillOpacity={1} fill="url(#colorOtdTemp)" animationDuration={300} />
                      </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-violet-100 shadow-sm">
                <h3 className="font-bold text-violet-700 text-sm flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-violet-50 pb-4">
                   Atmospheric Humidity
                </h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formattedData}>
                        <defs>
                          <linearGradient id="colorOtdHum" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={humColor} stopOpacity={0.5}/>
                            <stop offset="95%" stopColor={humColor} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede9fe" />
                        <XAxis dataKey="timeLabel" hide />
                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#7c3aed', fontSize: 10, fontWeight: 600 }} dx={-10} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                        <Area type="monotone" dataKey="humidity" stroke={humColor} strokeWidth={3} fillOpacity={1} fill="url(#colorOtdHum)" animationDuration={300} />
                      </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
}
