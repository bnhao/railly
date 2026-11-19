export type TaskStatus = "Pending" | "In Progress" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High";

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus | string;
  assigned_to: number | null;
  assigned_to_name?: string | null;
  assigned_to_email?: string | null;
  created_by: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  priority: TaskPriority | string;
  track_id: string;
  coordinates?: unknown;
}

export interface SubdivisionSummary {
  name: string;
  operator: string;
  trackId: string;
  count: number;
  lat: number;
  lon: number;
}
