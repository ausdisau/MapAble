"use client";

import { useCallback, useRef, useState } from "react";

export type UserLocationState = {
  lat: number;
  lng: number;
} | null;

export type UserLocationStatus =
  | "idle"
  | "loading"
  | "success"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported";

export type UserLocationResult = {
  location: UserLocationState;
  status: UserLocationStatus;
  message: string | null;
  requestLocation: () => void;
  clearLocation: () => void;
  isLoading: boolean;
};

const STATUS_MESSAGES: Record<Exclude<UserLocationStatus, "idle" | "loading" | "success">, string> = {
  denied:
    "Location permission was denied. You can still browse places using the list or map.",
  unavailable: "Your approximate device location could not be determined.",
  timeout: "The location request timed out. Please try again.",
  unsupported: "Your browser does not support geolocation.",
};

export function useUserLocation(): UserLocationResult {
  const [location, setLocation] = useState<UserLocationState>(null);
  const [status, setStatus] = useState<UserLocationStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setStatus("idle");
    setMessage(null);
  }, []);

  const requestLocation = useCallback(() => {
    if (requestInFlight.current) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setMessage(STATUS_MESSAGES.unsupported);
      return;
    }

    requestInFlight.current = true;
    setStatus("loading");
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        requestInFlight.current = false;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        setStatus("success");
        setMessage("Showing your approximate device location on the map.");
      },
      (error) => {
        requestInFlight.current = false;
        setLocation(null);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setStatus("denied");
            setMessage(STATUS_MESSAGES.denied);
            break;
          case error.POSITION_UNAVAILABLE:
            setStatus("unavailable");
            setMessage(STATUS_MESSAGES.unavailable);
            break;
          case error.TIMEOUT:
            setStatus("timeout");
            setMessage(STATUS_MESSAGES.timeout);
            break;
          default:
            setStatus("unavailable");
            setMessage(STATUS_MESSAGES.unavailable);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  }, []);

  return {
    location,
    status,
    message,
    requestLocation,
    clearLocation,
    isLoading: status === "loading",
  };
}
