import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';


dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'your_supabase_project_url') {
  console.error("ERROR: Please configure SUPABASE_URL and SUPABASE_ANON_KEY in .env file!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SIMULATION_INTERVAL_MS = 5000;
const SENSORS_STATE: Record<string, any> = {};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

console.log("=============== IOT SENSOR SIMULATOR ===============");
console.log(`Endpoint: ${SUPABASE_URL}/rest/v1/sensor_data`);
console.log(`Broadcast Interval: ${SIMULATION_INTERVAL_MS / 1000} seconds`);
console.log("=====================================================\n");

async function fetchSensors() {
  console.log("Scanning for active sensors in the database...");
  const { data: sensors, error } = await supabase
    .from('sensors')
    .select('*')
    .not('school_id', 'is', null);

  if (error) {
    console.error("Failed to fetch sensors:", error.message);
    return [];
  }

  return sensors || [];
}


async function sendSensorDataHttpLog(payload: any) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sensor_data`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal' 
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[REST ERROR - Sensor ${payload.sensor_id.slice(0,6)}] Failed to post data:`, errText);
    } else {
      console.log(`[HTTP POST] Payload Sent -> Sensor: ${payload.sensor_id.slice(0,4)}... | S: ${payload.school_id ? payload.school_id.slice(0,4) : 'NONE'} | C: ${payload.class_id ? payload.class_id.slice(0,4) : 'NONE'} | CO2: ${payload.co2} ppm | Battery: ${payload.battery}%`);
    }
  } catch (err: any) {
    console.error(`[NETWORK ERROR]`, err.message);
  }
}


function registerSensor(sensor: any) {
    if (!SENSORS_STATE[sensor.id] && sensor.school_id) {
        console.log(`\n[DYNAMIC EVENT] New Sensor detected and attached to engine: ${sensor.name} (${sensor.type})`);
        SENSORS_STATE[sensor.id] = {
            id: sensor.id,
            type: sensor.type,
            school_id: sensor.school_id,
            class_id: sensor.class_id,
            co2: sensor.type === 'indoor' ? randomInt(600, 800) : randomInt(400, 420),
            temp: sensor.type === 'indoor' ? randomFloat(21.0, 24.0) : randomFloat(10.0, 15.0),
            humidity: sensor.type === 'indoor' ? randomInt(40, 50) : randomInt(50, 70),
            battery: sensor.battery || 100, 
            ventilating: false 
        };
    } else if (SENSORS_STATE[sensor.id]) {
        if (!sensor.school_id) {
            console.log(`\n[DYNAMIC EVENT] Sensor (${sensor.name}) unassigned from school. Removing from engine...`);
            delete SENSORS_STATE[sensor.id];
        } else {
            if (SENSORS_STATE[sensor.id].school_id !== sensor.school_id || SENSORS_STATE[sensor.id].class_id !== sensor.class_id) {
                console.log(`\n[DYNAMIC EVENT] Sensor (${sensor.name}) location updated.`);
                SENSORS_STATE[sensor.id].school_id = sensor.school_id;
                SENSORS_STATE[sensor.id].class_id = sensor.class_id;
            }
            if (sensor.battery !== undefined && SENSORS_STATE[sensor.id].battery !== sensor.battery) {
                if (sensor.battery === 100) {
                    console.log(`\n[⚡ RECHARGED] Sensor (${sensor.name}) restored to 100% capacity.`);
                }
                SENSORS_STATE[sensor.id].battery = sensor.battery;
            }
        }
    }
}

async function runSimulator() {
  const activeSensors = await fetchSensors();
  
  for (const sensor of activeSensors) {
      registerSensor(sensor);
  }

  if (activeSensors.length === 0) {
    console.warn("WARNING: No active sensors found at boot!\nAny sensor assigned via Web Panel will automatically appear here. Pending...\n");
  } else {
    console.log(`${activeSensors.length} sensor(s) loaded. Engine running...\n`);
  }


  supabase.channel('public:sensors')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sensors' },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          registerSensor(payload.new);
        } else if (payload.eventType === 'DELETE') {
            const oldSensor = payload.old;
            if (SENSORS_STATE[oldSensor.id]) {
                console.log(`\n[DYNAMIC EVENT] Sensor wiped from database completely. Shutting down its process...`);
                delete SENSORS_STATE[oldSensor.id];
            }
        }
      }
    )
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            console.log("[SUPABASE WEBSOCKETS] Listening for Database Realtime events...");
        }
    });


  supabase.channel('simulator_control')
    .on(
      'broadcast',
      { event: 'OVERRIDE_EVENT' },
      (payload) => {
          const { sensor_id, co2, temp, humidity, battery } = payload.payload;
          if (SENSORS_STATE[sensor_id]) {
              console.log(`\n[!!! MANUAL OVERRIDE !!!] Admin Panel forced new telemetry values -> ID: ${sensor_id.slice(0,6)}`);
              if (co2 !== undefined && co2 !== "") SENSORS_STATE[sensor_id].co2 = Number(co2);
              if (temp !== undefined && temp !== "") SENSORS_STATE[sensor_id].temp = Number(temp);
              if (humidity !== undefined && humidity !== "") SENSORS_STATE[sensor_id].humidity = Number(humidity);
              if (battery !== undefined && battery !== "") SENSORS_STATE[sensor_id].battery = Number(battery);
              
              if (SENSORS_STATE[sensor_id].co2 >= 1500) SENSORS_STATE[sensor_id].ventilating = true;
          }
      }
    )
    .on(
      'broadcast',
      { event: 'PROCESS_CONTROL' },
      (payload) => {
          if (payload.payload.command === 'STOP') {
              console.log("\n[X] SHUTDOWN SIGNAL RECEIVED FROM WEB INTERFACE. TERMINATING PROCESS...");
              process.exit(0);
          }
      }
    )
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
             console.log("[BROADCAST CHANNEL] Standing by for Admin Control Override & Process commands...");
        }
    });


  setInterval(() => {
    

    supabase.channel('simulator_control').send({
      type: 'broadcast',
      event: 'HEARTBEAT',
      payload: { status: 'RUNNING' }
    });

    for (const sensorId in SENSORS_STATE) {
      const state = SENSORS_STATE[sensorId];

      if (state.battery <= 0) continue;

      if (Math.random() < 0.05) state.battery -= 1;

      if (state.type === 'indoor') {
        if (!state.ventilating) {
          state.co2 += randomInt(15, 45); 
          state.temp += randomFloat(0.1, 0.3);
          state.humidity += randomInt(0, 2);
          if (state.co2 > 1500) state.ventilating = true;
        } else {
          state.co2 -= randomInt(80, 120);
          state.temp -= randomFloat(0.2, 0.5);
          state.humidity -= randomInt(1, 3);
          if (state.co2 <= 650) state.ventilating = false;
        }
      } else if (state.type === 'outdoor') { 
        state.co2 += randomInt(-5, 5);
        state.temp += randomFloat(-0.5, 0.5);
        state.humidity += randomInt(-2, 2);
        
        if (state.co2 < 400) state.co2 = 400;
        if (state.co2 > 480) state.co2 = 480;
      }

      state.temp = parseFloat(state.temp.toFixed(1));
      if (state.humidity > 100) state.humidity = 100;
      if (state.humidity < 0) state.humidity = 0;
      if (state.battery < 0) state.battery = 0;

      const payload = {
        sensor_id: state.id,
        school_id: state.school_id,
        class_id: state.class_id,
        co2: state.co2,
        temp: state.temp,
        humidity: state.humidity,
        battery: state.battery
      };

      sendSensorDataHttpLog(payload);
    }
  }, SIMULATION_INTERVAL_MS);
}

runSimulator();
