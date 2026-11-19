import { Task } from "@/types/task";
import { formatDateOnly, getTodayDateString } from "@/utils/coordinates";

export type RiskSeverity = "critical" | "high" | "advisory";
export type RiskCategory =
  | "weather"
  | "overdue"
  | "priority"
  | "unassigned"
  | "hotspot";

export interface RailwayCorridor {
  id: string;
  name: string;
  operator: string;
  trackId: string;
  region: string;
  lat: number;
  lon: number;
}

export interface WeatherSeriesPoint {
  dt: number;
  time: string;
  tempC: number;
  windKmh: number;
  gustKmh: number;
  condition: string;
}

export interface SuggestedDispatchTask {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  trackId: string;
  trackLabel: string;
  lat: number;
  lon: number;
}

export interface OperationalRisk {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  title: string;
  detail: string;
  trackId: string;
  trackLabel: string;
  taskId?: number;
  lat?: number;
  lon?: number;
  suggestedTask?: SuggestedDispatchTask;
}

export interface CorridorWeatherSnapshot {
  id: string;
  name: string;
  operator: string;
  trackId: string;
  region: string;
  lat: number;
  lon: number;
  tempC: number;
  feelsLikeC: number;
  windKmh: number;
  gustKmh: number;
  windDeg: number;
  humidity: number;
  condition: string;
  description: string;
  precipMm: number;
  series: WeatherSeriesPoint[];
  riskLevel: "normal" | RiskSeverity;
  risks: OperationalRisk[];
  degraded?: boolean;
}

export const KEY_CORRIDORS: RailwayCorridor[] = [
  {
    id: "laggan",
    name: "Laggan Subdivision",
    operator: "CPKC",
    trackId: "way/4588734",
    region: "Calgary – Banff",
    lat: 51.1643,
    lon: -114.4242,
  },
  {
    id: "edson",
    name: "CN Edson Subdivision",
    operator: "Canadian National Railway",
    trackId: "way/23427531",
    region: "Edmonton – Jasper",
    lat: 53.5589,
    lon: -113.6887,
  },
  {
    id: "brooks",
    name: "Brooks Subdivision",
    operator: "CPKC",
    trackId: "way/4717101",
    region: "Calgary – Medicine Hat",
    lat: 51.0047,
    lon: -114.0118,
  },
  {
    id: "red-deer",
    name: "Red Deer Subdivision",
    operator: "CPKC",
    trackId: "way/23349226",
    region: "Calgary – Red Deer",
    lat: 51.1081,
    lon: -114.049,
  },
  {
    id: "crowsnest",
    name: "Crowsnest Subdivision",
    operator: "CPKC",
    trackId: "way/23259989",
    region: "Lethbridge – Crowsnest Pass",
    lat: 49.5374,
    lon: -113.866,
  },
  {
    id: "wainwright",
    name: "Wainwright Subdivision",
    operator: "CN / VIA Rail",
    trackId: "way/23426573",
    region: "Edmonton – Wainwright",
    lat: 53.5836,
    lon: -113.4474,
  },
];

const SEVERITY_RANK: Record<RiskSeverity, number> = {
  critical: 3,
  high: 2,
  advisory: 1,
};

export function maxRiskSeverity(
  current: "normal" | RiskSeverity,
  candidate: RiskSeverity
): RiskSeverity {
  if (current === "normal") return candidate;
  return SEVERITY_RANK[candidate] > SEVERITY_RANK[current]
    ? candidate
    : current;
}

/**
 * Evaluates industry railway weather hazard thresholds on a corridor snapshot.
 */
export function evaluateWeatherRisk(snapshot: {
  id: string;
  name: string;
  trackId: string;
  lat: number;
  lon: number;
  tempC: number;
  windKmh: number;
  gustKmh: number;
  condition: string;
  precipMm: number;
}): { level: "normal" | RiskSeverity; risks: OperationalRisk[] } {
  const risks: OperationalRisk[] = [];
  let level: "normal" | RiskSeverity = "normal";

  const { id, name, trackId, lat, lon, tempC, windKmh, gustKmh, condition, precipMm } =
    snapshot;

  // 1. Cold-weather rail pull-apart / brittle fracture risk
  if (tempC <= -30) {
    level = maxRiskSeverity(level, "critical");
    risks.push({
      id: `wx-cold-${id}`,
      category: "weather",
      severity: "critical",
      title: `Extreme Cold Rail Inspection (${tempC}°C)`,
      detail: `${name}: High risk of rail contraction pull-apart and brittle fracture. Cold-weather patrol required.`,
      trackId,
      trackLabel: name,
      lat,
      lon,
      suggestedTask: {
        title: `Cold-Weather Rail Integrity Patrol — ${name}`,
        description: `Automated Alert: Ambient temperature reached ${tempC}°C on ${name} (${trackId}). Inspect rail joints, switches, and signals for contraction gaps or broken rail.`,
        priority: "High",
        trackId,
        trackLabel: name,
        lat,
        lon,
      },
    });
  } else if (tempC <= -20) {
    level = maxRiskSeverity(level, "high");
    risks.push({
      id: `wx-cold-${id}`,
      category: "weather",
      severity: "high",
      title: `Sub-Zero Stress Check (${tempC}°C)`,
      detail: `${name}: Low temperature increases rail tension and switch heater demand.`,
      trackId,
      trackLabel: name,
      lat,
      lon,
      suggestedTask: {
        title: `Switch Heater & Joint Check — ${name}`,
        description: `Automated Alert: ${tempC}°C recorded on ${name} (${trackId}). Verify switch heaters and inspect high-stress rail curves.`,
        priority: "High",
        trackId,
        trackLabel: name,
        lat,
        lon,
      },
    });
  } else if (tempC <= -12) {
    level = maxRiskSeverity(level, "advisory");
    risks.push({
      id: `wx-cold-${id}`,
      category: "weather",
      severity: "advisory",
      title: `Frost & Switch Advisory (${tempC}°C)`,
      detail: `${name}: Monitor switch points and brake air lines in freezing temperatures.`,
      trackId,
      trackLabel: name,
      lat,
      lon,
      suggestedTask: {
        title: `Cold Weather Switch Verification — ${name}`,
        description: `Automated Alert: Freezing conditions (${tempC}°C) along ${name} (${trackId}). Confirm switch points remain ice-free.`,
        priority: "Medium",
        trackId,
        trackLabel: name,
        lat,
        lon,
      },
    });
  }

  // 2. Heat-induced rail buckling / sun-kink risk
  if (tempC >= 36) {
    level = maxRiskSeverity(level, "critical");
    risks.push({
      id: `wx-heat-${id}`,
      category: "weather",
      severity: "critical",
      title: `Heat Buckle / Sun-Kink Alert (${tempC}°C)`,
      detail: `${name}: Extreme rail thermal expansion risk. Immediate slow-order & alignment patrol advised.`,
      trackId,
      trackLabel: name,
      lat,
      lon,
      suggestedTask: {
        title: `Heat Buckle Alignment Patrol — ${name}`,
        description: `Automated Alert: Extreme heat (${tempC}°C) along ${name} (${trackId}). Inspect welded rail alignment for sun-kinks and verify slow-order compliance.`,
        priority: "High",
        trackId,
        trackLabel: name,
        lat,
        lon,
      },
    });
  } else if (tempC >= 30) {
    level = maxRiskSeverity(level, "high");
    risks.push({
      id: `wx-heat-${id}`,
      category: "weather",
      severity: "high",
      title: `High Rail Thermal Warning (${tempC}°C)`,
      detail: `${name}: Elevated ambient heat increases continuous welded rail buckling risk.`,
      trackId,
      trackLabel: name,
      lat,
      lon,
      suggestedTask: {
        title: `Thermal Track Patrol — ${name}`,
        description: `Automated Alert: High temperature (${tempC}°C) on ${name} (${trackId}). Spot-check curve alignment and ballast shoulders.`,
        priority: "Medium",
        trackId,
        trackLabel: name,
        lat,
        lon,
      },
    });
  }

  // 3. Crosswind & blow-over / debris risk
  const peakWind = Math.max(windKmh, gustKmh);
  if (gustKmh >= 75 || windKmh >= 60) {
    level = maxRiskSeverity(level, "critical");
    risks.push({
      id: `wx-wind-${id}`,
      category: "weather",
      severity: "critical",
      title: `Severe Crosswind Warning (${peakWind} km/h)`,
      detail: `${name}: Wind speed ${windKmh} km/h (gusts ${gustKmh} km/h). Container blow-over & fallen debris hazard.`,
      trackId,
      trackLabel: name,
      lat,
      lon,
      suggestedTask: {
        title: `High-Wind Debris & Catenary Patrol — ${name}`,
        description: `Automated Alert: Severe crosswinds (${windKmh} km/h, gusts ${gustKmh} km/h) on ${name} (${trackId}). Patrol right-of-way for blown debris and inspect empty double-stack corridors.`,
        priority: "High",
        trackId,
        trackLabel: name,
        lat,
        lon,
      },
    });
  } else if (gustKmh >= 55 || windKmh >= 45) {
    level = maxRiskSeverity(level, "high");
    risks.push({
      id: `wx-wind-${id}`,
      category: "weather",
      severity: "high",
      title: `High Wind Corridor Alert (${peakWind} km/h)`,
      detail: `${name}: Winds at ${windKmh} km/h (gusts ${gustKmh} km/h) exceed 45 km/h patrol threshold.`,
      trackId,
      trackLabel: name,
      lat,
      lon,
      suggestedTask: {
        title: `Wind Hazard Line Inspection — ${name}`,
        description: `Automated Alert: High winds (${windKmh} km/h, gusts ${gustKmh} km/h) on ${name} (${trackId}). Check wayside signage, crossings, and tree clearances.`,
        priority: "High",
        trackId,
        trackLabel: name,
        lat,
        lon,
      },
    });
  } else if (gustKmh >= 40 || windKmh >= 35) {
    level = maxRiskSeverity(level, "advisory");
    risks.push({
      id: `wx-wind-${id}`,
      category: "weather",
      severity: "advisory",
      title: `Strong Breeze Advisory (${peakWind} km/h)`,
      detail: `${name}: Sustained wind ${windKmh} km/h with gusts up to ${gustKmh} km/h.`,
      trackId,
      trackLabel: name,
      lat,
      lon,
      suggestedTask: {
        title: `Corridor Wind Advisory Patrol — ${name}`,
        description: `Automated Alert: Gusts reaching ${peakWind} km/h on ${name} (${trackId}). Monitor exposed bridges and wayside equipment.`,
        priority: "Medium",
        trackId,
        trackLabel: name,
        lat,
        lon,
      },
    });
  }

  // 4. Storm / snow / ice precipitation risk
  const condLower = condition.toLowerCase();
  if (
    condLower.includes("thunderstorm") ||
    condLower.includes("snow") ||
    condLower.includes("sleet") ||
    (tempC <= 1 && precipMm > 0)
  ) {
    const stormSeverity: RiskSeverity =
      condLower.includes("thunderstorm") || precipMm >= 3 ? "high" : "advisory";
    level = maxRiskSeverity(level, stormSeverity);
    risks.push({
      id: `wx-precip-${id}`,
      category: "weather",
      severity: stormSeverity,
      title: `${condition} Operational Hazard (${name})`,
      detail: `${name}: Active ${condition.toLowerCase()} at ${tempC}°C affects braking adhesion, turnouts, and drainage.`,
      trackId,
      trackLabel: name,
      lat,
      lon,
      suggestedTask: {
        title: `Weather Switch & Drainage Check — ${name}`,
        description: `Automated Alert: ${condition} (${precipMm} mm) detected along ${name} (${trackId}). Clear switch points and inspect culvert drainage.`,
        priority: stormSeverity === "high" ? "High" : "Medium",
        trackId,
        trackLabel: name,
        lat,
        lon,
      },
    });
  }

  return { level, risks };
}

/**
 * Evaluates live operational risks by combining weather hazards with active task anomalies.
 */
export function evaluateOperationalRisks(
  tasks: Task[],
  corridorWeather: CorridorWeatherSnapshot[]
): OperationalRisk[] {
  const risks: OperationalRisk[] = [];
  const today = getTodayDateString();
  const trackOpenCount = new Map<string, number>();

  for (const corridor of corridorWeather) {
    for (const wxRisk of corridor.risks) {
      risks.push(wxRisk);
    }
  }

  for (const task of tasks) {
    const isCompleted = task.status?.toLowerCase() === "completed";
    if (isCompleted) continue;

    const trackKey = String(task.track_id || "");
    if (trackKey) {
      trackOpenCount.set(trackKey, (trackOpenCount.get(trackKey) || 0) + 1);
    }

    const endDate = formatDateOnly(task.end_date);
    if (endDate && endDate < today) {
      risks.push({
        id: `task-overdue-${task.id}`,
        category: "overdue",
        severity: task.priority?.toLowerCase() === "high" ? "critical" : "high",
        title: `Overdue Work Order #${task.id}: ${task.title}`,
        detail: `Due ${endDate} — still ${task.status}${task.assigned_to_name ? ` (Assigned: ${task.assigned_to_name})` : " (Unassigned)"} on ${task.track_id}.`,
        trackId: trackKey,
        trackLabel: trackKey,
        taskId: task.id,
      });
    } else if (
      task.priority?.toLowerCase() === "high" &&
      task.status?.toLowerCase() === "pending"
    ) {
      risks.push({
        id: `task-high-pending-${task.id}`,
        category: "priority",
        severity: "high",
        title: `Unstarted High-Priority Order #${task.id}`,
        detail: `${task.title} on ${task.track_id} is High priority and still Pending.`,
        trackId: trackKey,
        trackLabel: trackKey,
        taskId: task.id,
      });
    }

    if (!task.assigned_to) {
      risks.push({
        id: `task-unassigned-${task.id}`,
        category: "unassigned",
        severity: "advisory",
        title: `Unassigned Work Order #${task.id}`,
        detail: `${task.title} (${task.track_id}) has no assigned field crew member.`,
        trackId: trackKey,
        trackLabel: trackKey,
        taskId: task.id,
      });
    }
  }

  for (const [trackId, count] of trackOpenCount.entries()) {
    if (count >= 2) {
      risks.push({
        id: `track-hotspot-${trackId}`,
        category: "hotspot",
        severity: "advisory",
        title: `Repeat Open Maintenance Hotspot (${trackId})`,
        detail: `${count} active open work orders concentrated on track ${trackId}.`,
        trackId,
        trackLabel: trackId,
      });
    }
  }

  return risks.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}
