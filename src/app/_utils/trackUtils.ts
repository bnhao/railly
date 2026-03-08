// utils/trackUtils.ts
import { trackMaintenanceData, trackDetails } from "@/data/trackData";

export const getSelectedTrackMaintenance = (selectedTrack: string) =>
  selectedTrack ? trackMaintenanceData[selectedTrack] : trackMaintenanceData["Track 1"];

export const getSelectedTrackDetails = (selectedTrack: string) =>
  selectedTrack ? trackDetails[selectedTrack] : trackDetails["Track 1"];
