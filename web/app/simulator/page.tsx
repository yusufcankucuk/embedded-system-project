"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ServerIcon, SendHorizontal, RadioReceiver, Activity, Play, Square, Home } from "lucide-react";
import Link from "next/link";
import { startSimulatorProcess } from "./actions";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StandaloneSimulatorPage() {
    const [sensors, setSensors] = useState<any[]>([]);
    const [isEngineRunning, setIsEngineRunning] = useState(false);
    const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);


    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        async function fetchSensors() {
            const { data } = await supabase.from('sensors').select('*').order('created_at', { ascending: false });
            if (data) setSensors(data);
        }
        fetchSensors();


        const channel = supabase.channel('simulator_control')
            .on('broadcast', { event: 'HEARTBEAT' }, (payload) => {
                if (payload.payload.status === 'RUNNING') {
                    setIsEngineRunning(true);
                    setLastHeartbeat(new Date());
                }
            })
            .subscribe();

        const interval = setInterval(() => {

            setLastHeartbeat(prev => {
                if (prev && (new Date().getTime() - prev.getTime()) > 8000) {
                    setIsEngineRunning(false);
                }
                return prev;
            });
        }, 2000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, []);

    const handleInputChange = (sensorId: string, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [sensorId]: {
                ...(prev[sensorId] || {}),
                [field]: value
            }
        }));
    };

    const handleOverride = async (sensorId: string) => {
        const dataToOverride = formData[sensorId];
        if (!dataToOverride || Object.keys(dataToOverride).length === 0) return;

        const channel = supabase.channel('simulator_control');
        await channel.send({
            type: 'broadcast',
            event: 'OVERRIDE_EVENT',
            payload: { sensor_id: sensorId, ...dataToOverride }
        });

        setFormData(prev => ({ ...prev, [sensorId]: {} }));
    };

    const startEngine = async () => {
        await startSimulatorProcess();

    };

    const stopEngine = async () => {
        const channel = supabase.channel('simulator_control');
        await channel.send({
            type: 'broadcast',
            event: 'PROCESS_CONTROL',
            payload: { command: 'STOP' }
        });
        setTimeout(() => setIsEngineRunning(false), 1000);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header Block */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-orange-100 shadow-sm">
                    <div>
                        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg mb-4 hover:bg-orange-100 transition-colors w-max">
                            <Home size={16} /> Back to Admin
                        </Link>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                            <ServerIcon className="text-orange-500" />
                            Simulator Control Panel
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Control the Node.js Simulation process and forcefully override sensor telemetries.</p>
                    </div>

                    <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-4 h-4 rounded-full shadow-md ${isEngineRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                            <span className="font-bold text-slate-700 tracking-wider uppercase">{isEngineRunning ? 'System Online' : 'System Offline'}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={startEngine}
                                disabled={isEngineRunning}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${isEngineRunning ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white shadow-sm'}`}
                            >
                                <Play size={16} /> Start
                            </button>
                            <button
                                onClick={stopEngine}
                                disabled={!isEngineRunning}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${!isEngineRunning ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white shadow-sm'}`}
                            >
                                <Square size={16} /> Stop
                            </button>
                        </div>
                    </div>
                </header>

                {/* Sensor Controls Map */}
                <div className="bg-white rounded-3xl border border-orange-100 p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <Activity className="text-orange-500" />
                        Live Sensor Map Iteration
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {sensors.length === 0 ? (
                            <div className="col-span-full text-center text-slate-500 p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">No sensors exist in the database.</div>
                        ) : sensors.map(sensor => (
                            <div key={sensor.id} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl hover:border-orange-300 transition-colors group flex flex-col gap-4">

                                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            <RadioReceiver size={20} className={sensor.type === 'indoor' ? "text-orange-500" : "text-cyan-500"} />
                                            {sensor.name}
                                        </h3>
                                        <p className="text-xs font-mono text-slate-400 mt-1 uppercase">ID: {sensor.id.split('-')[0]}</p>
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${sensor.type === 'indoor' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'}`}>
                                        {sensor.type}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <input
                                        type="number"
                                        value={formData[sensor.id]?.co2 || ""}
                                        onChange={(e) => handleInputChange(sensor.id, 'co2', e.target.value)}
                                        placeholder="Edit CO2 (ppm)"
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400 font-medium text-sm transition-all"
                                    />
                                    <input
                                        type="number"
                                        value={formData[sensor.id]?.temp || ""}
                                        onChange={(e) => handleInputChange(sensor.id, 'temp', e.target.value)}
                                        placeholder="Edit Temp (°C)"
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400 font-medium text-sm transition-all"
                                    />
                                    <input
                                        type="number"
                                        value={formData[sensor.id]?.humidity || ""}
                                        onChange={(e) => handleInputChange(sensor.id, 'humidity', e.target.value)}
                                        placeholder="Edit Humidity (%)"
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400 font-medium text-sm transition-all"
                                    />
                                    <input
                                        type="number"
                                        value={formData[sensor.id]?.battery || ""}
                                        onChange={(e) => handleInputChange(sensor.id, 'battery', e.target.value)}
                                        placeholder="Edit Battery (%)"
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-400 font-medium text-sm transition-all"
                                    />
                                </div>

                                <button
                                    onClick={() => handleOverride(sensor.id)}
                                    disabled={!isEngineRunning}
                                    className={`mt-2 font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all w-full ${!isEngineRunning ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 text-white shadow-md'}`}
                                >
                                    <SendHorizontal size={18} /> Override Telemetry
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
