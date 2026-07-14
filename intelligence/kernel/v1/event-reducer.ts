import type {
  AppointmentEvent,
  AppointmentMissionState,
} from "./appointment-types";
import {
  reduceAppointmentEvent,
  replayAppointmentMission as replayRawAppointmentMission,
} from "./appointment-reducer";

export function reduceAppointmentMission(
  state: AppointmentMissionState,
  event: AppointmentEvent,
): AppointmentMissionState {
  if (state.events.some((existing) => existing.id === event.id)) return state;
  return reduceAppointmentEvent(state, event);
}

export function replayAppointmentMission(
  initial: AppointmentMissionState,
  events: AppointmentEvent[],
): AppointmentMissionState {
  return events.reduce(reduceAppointmentMission, initial);
}

export { replayRawAppointmentMission };
