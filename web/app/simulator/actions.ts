"use server";

import { spawn } from 'child_process';
import path from 'path';

export async function startSimulatorProcess() {
   const simPath = path.resolve(process.cwd(), '../simulator');
   

   const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
   
   try {
       const child = spawn(npmCmd, ['run', 'start'], {
           cwd: simPath,
           detached: true, 
           stdio: 'ignore', 
           shell: true // CRITICAL FOR WINDOWS
       });
       child.unref(); 
       return { success: true };
   } catch (e: any) {
       console.error("Failed to start simulator:", e);
       return { success: false, error: e.message };
   }
}
