import { edgeAiConfig } from "@/lib/config/edge-ai";

import type { DeviceCapabilitySnapshot, ProcessingMode } from "./types";

/**
 * Processing ladder:
 * 1. deterministic local function
 * 2. on-device model
 * 3. privacy-disclosed cloud model
 * 4. human assistance
 */
export function selectProcessingMode(input: {
  device: DeviceCapabilitySnapshot;
  allowOnDevice: boolean;
  allowCloud: boolean;
  requiresModel: boolean;
}): ProcessingMode {
  if (!edgeAiConfig.enabled) {
    return "deterministic_local";
  }

  if (
    input.device.accessibilityPreferDeterministic ||
    input.device.dataSensitivity === "health_sensitive"
  ) {
    return input.requiresModel ? "human_assistance" : "deterministic_local";
  }

  if (!input.requiresModel) {
    return "deterministic_local";
  }

  if (
    input.allowOnDevice &&
    edgeAiConfig.onDeviceEnabled &&
    input.device.hasOnDeviceModelRuntime &&
    input.device.osSupportsOnDeviceAi &&
    input.device.modelAvailable &&
    input.device.preferLocalProcessing &&
    (input.device.batteryPercent == null || input.device.batteryPercent > 15)
  ) {
    return "on_device_model";
  }

  if (
    input.allowCloud &&
    edgeAiConfig.cloudFallbackEnabled &&
    input.device.networkAvailable &&
    input.device.consentAllowsCloud &&
    !input.device.preferLocalProcessing
  ) {
    return "privacy_disclosed_cloud";
  }

  if (input.requiresModel) {
    return "human_assistance";
  }

  return "deterministic_local";
}
