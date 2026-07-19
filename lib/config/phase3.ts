export const phase3Config = {
  calendarExternalSyncEnabled:
    process.env.CALENDAR_EXTERNAL_SYNC_ENABLED === "true",
  transportLiveTrackingEnabled:
    process.env.TRANSPORT_LIVE_TRACKING_ENABLED === "true",
  transportRoutingEnabled: process.env.TRANSPORT_ROUTING_ENABLED === "true",
  jobsPublicBoardEnabled: process.env.JOBS_PUBLIC_BOARD_ENABLED === "true",
  orchestrationEnabled: process.env.ORCHESTRATION_ENABLED === "true",
};
