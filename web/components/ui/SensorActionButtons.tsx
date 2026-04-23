"use client";

import { Trash2, Link2Off } from "lucide-react";

export default function SensorActionButtons({ 
    isAssigned 
}: { 
    isAssigned: boolean;
}) {
    return (
        <div className="flex justify-end gap-2">
            {isAssigned && (
                <button 
                  type="submit" 
                  name="action_type" 
                  value="unbind"
                  className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors inline-block tooltip-trigger"
                  title="Unassign / Unbind Sensor"
                  onClick={(e) => {
                      if(!confirm("Are you sure? You are about to unbind this sensor from its current assigned location.")) {
                          e.preventDefault();
                      }
                  }}
                >
                    <Link2Off size={18} />
                </button>
            )}
            <button 
                type="submit" 
                name="action_type" 
                value="delete"
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block tooltip-trigger"
                title="Delete Sensor Permanently"
                onClick={(e) => {
                    if(!confirm("WARNING: Are you sure you want to completely DELETE this sensor and all of its historical telemetry data?")) {
                        e.preventDefault();
                    }
                }}
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}
