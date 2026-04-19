# Final Project Report (Draft)
**Project Title:** Enterprise IoT Air Quality Monitoring System for Educational Facilities
**Date:** April 2026

## 1. Executive Summary
This project delivers a state-of-the-art, production-ready IoT data telemetry dashboard tailored for schools. It actively monitors indoor and outdoor atmospheric metrics (CO2 levels, Temperature, Humidity, and Battery lifespans of edge devices) in real-time. By leveraging a modern tech stack (Next.js & Supabase) coupled with a scalable event-driven simulator, the system provides powerful fleet-management aesthetics specifically designed to ensure the safety and comfort of school environments through rapid situational awareness and automated alerting.

## 2. System Architecture & Tech Stack
The project is built upon a hybrid microservices architecture:
- **Frontend / Backend Web Service:** Built with **Next.js 15 (App Router)** heavily utilizing React Server Components and Server Actions to guarantee high performance, robust indexing, and instant data mutations without thick client-side fetching logic.
- **Styling & UI:** **Tailwind CSS** handles the dynamic, rich, glassmorphism-inspired UI components. The system features responsive design, smooth micro-animations, and multi-metric scalable charts built with **Recharts** and tailored color palettes for distinct environments (Classrooms vs. Outdoor hubs).
- **Database & Realtime Subsystem:** Powered by **Supabase (PostgreSQL)**, providing robust features such as:
    - Row Level Security (RLS) for data integrity.
    - PostgreSQL Triggers and Views (`classroom_live_status`, `low_battery_sensors`) for instant aggregations.
    - Supabase Realtime Channels (WebSockets) for broadcasting hardware telemetry instantaneously to client dashboards.
- **Dynamic IoT Simulator:** A separate **Node.js** daemon utilizing the `@supabase/supabase-js` realtime broadcast protocol natively integrated. It operates asynchronously and listens for multi-parameter manual overrides directed from the Web UI.

## 3. Core Features & Capabilities
### 3.1 Fleet Management (Admin Dashboard)
- Centralized deployment UI for enrolling 'Indoor' and 'Outdoor' sensors.
- Bulletproof duplicate prevention mechanics and strict assignments.
- Graceful Unbind and Cascade Delete functions that prevent foreign-key restriction errors and handle cleanup seamlessly.
- Battery health overviews and offline warnings for hardware lifecycle management.

### 3.2 Dual-Tier Operational Dashboards
- **School Dashboard:** Provides overarching facility data, including aggregated classroom status metrics color-coded by severity, and a dedicated `Outdoor Atmosphere Hub`.
- **Live Classroom Telemetry (`/school/[id]/class/[classId]`):** A deeply immersive dashboard showing real-time multi-chart trends for atmospheric CO2 saturation, Temperature, and Humidity. Incorporates dynamic thresholding that shifts UI colors across "Excellent", "Warning", and "Critical" states.
- **Outdoor Telemetry (`/school/[id]/outdoor`):** A custom blue/cyan/violet-themed reporting interface specialized for external environmental conditions. Exclusively locked to a maximum of one sensor per school via systematic UI restrictions.

### 3.3 Simulator Control Center
- A standalone command center (`/simulator`) operating independently of the administrative application.
- Employs `child_process` hooks to boot the external Node.js hardware simulator natively from the web interface.
- Includes granular manual override inputs allowing administrators to artificially inject CO2, Temperature, Humidity, or Battery values into targeted zones to simulate "Environmental Hazard" events on the fly. 

## 4. Stability & Security Upgrades
During the development lifecycle, paramount focus was placed on edge-case stability:
- Implemented `LIMIT(1)` queries replacing `.single()` lookups to guarantee uninterrupted system execution even in cases of backend multi-row faults.
- Constructed robust POSTgreSQL RLS policies allowing administrative `DELETE` commands to correctly drop child-dependent rows.
- Shifted sensitive form actions exclusively to `Server Actions`, completely masking database operations from the browser layer.

## 5. Conclusion
The resulting product transcends a standard MVP; it is an intuitive, highly optimized, enterprise-grade interface. The real-time visual feedback loops combined with the simulated network of independent sensors stand as a prominent showcase of modern web engineering capable of monitoring critical infrastructure flawlessly.
