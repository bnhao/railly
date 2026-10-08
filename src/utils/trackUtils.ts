// utils/trackUtils.ts
import { trackMaintenanceData, trackDetails } from "@/data/trackData";

export const getSelectedTrackMaintenance = (selectedTrack: string) =>
  selectedTrack ? trackMaintenanceData[selectedTrack as keyof typeof trackMaintenanceData] : trackMaintenanceData["Track 1"];

export const getSelectedTrackDetails = (selectedTrack: string) =>
  selectedTrack ? trackDetails[selectedTrack as keyof typeof trackDetails] : trackDetails["Track 1"];
