"use client";

import {
  ConnectionState,
  Room,
  RoomEvent,
  type RemoteTrack,
} from "livekit-client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { maxMessageLength } from "@/packages/contracts/src/healthcare-preview";

import styles from "./healthcare.module.css";

const codePattern = /^[0-9a-f]{32}$/;
const chatTopic = "mapable-practice-text";
type Message = { id: number; speaker: string; text: string };
type LabStatus = "idle" | "connecting" | "connected" | "reconnecting";

export function MediaLab() {
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState<LabStatus>("idle");
  const [error, setError] = useState("");
  const [camera, setCamera] = useState(false);
  const [microphone, setMicrophone] = useState(false);
  const [devicePending, setDevicePending] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const currentRoom = useRef<Room | null>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const mediaBox = useRef<HTMLDivElement>(null);
  const messageId = useRef(0);

  useEffect(
    () => () => {
      const room = currentRoom.current;
      currentRoom.current = null;
      void room?.disconnect();
    },
    [],
  );

  function detachRemote(track: RemoteTrack) {
    track.detach().forEach((element) => element.remove());
  }

  function appendMessage(speaker: string, text: string) {
    const message = { id: ++messageId.current, speaker, text };
    setMessages((previous) => [...previous.slice(-19), message]);
  }

  function leave(message = "") {
    const room = currentRoom.current;
    currentRoom.current = null;
    void room?.disconnect();
    mediaBox.current?.replaceChildren();
    if (localVideo.current) localVideo.current.srcObject = null;
    setCamera(false);
    setMicrophone(false);
    setDevicePending(false);
    setPeerCount(0);
    setDraft("");
    setMessages([]);
    setStatus("idle");
    setError(message);
  }

  async function connect(code: string) {
    if (currentRoom.current || !codePattern.test(code)) return;

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    currentRoom.current = room;
    setRoomCode(code);
    setError("");
    setStatus("connecting");

    const updatePeerCount = () => {
      if (currentRoom.current === room)
        setPeerCount(room.remoteParticipants.size);
    };
    room.on(RoomEvent.ParticipantConnected, updatePeerCount);
    room.on(RoomEvent.ParticipantDisconnected, updatePeerCount);
    room.on(RoomEvent.ConnectionStateChanged, (connection) => {
      if (currentRoom.current !== room) return;
      if (connection === ConnectionState.Reconnecting)
        setStatus("reconnecting");
      if (connection === ConnectionState.Connected) setStatus("connected");
    });
    room.on(RoomEvent.Disconnected, () => {
      if (currentRoom.current === room)
        leave("Connection ended. You can join again.");
    });
    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (currentRoom.current !== room || !mediaBox.current) return;
      const element = track.attach();
      element.controls = true;
      element.setAttribute(
        "aria-label",
        track.kind === "video" ? "Peer camera" : "Peer audio",
      );
      mediaBox.current.append(element);
    });
    room.on(RoomEvent.TrackUnsubscribed, detachRemote);
    room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
      if (
        currentRoom.current !== room ||
        !participant ||
        topic !== chatTopic ||
        payload.byteLength > maxMessageLength * 4
      )
        return;
      const text = new TextDecoder().decode(payload).trim();
      if (text && text.length <= maxMessageLength) appendMessage("Peer", text);
    });

    try {
      const response = await fetch("/telehealth/preview/media/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: code }),
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error("The local lab could not issue a token.");
      const grant: { url: string; token: string } = await response.json();
      if (currentRoom.current !== room) return;
      await room.connect(grant.url, grant.token, {
        rtcConfig: { iceServers: [] },
      });
      if (currentRoom.current !== room) {
        void room.disconnect();
        return;
      }
      updatePeerCount();
    } catch {
      if (currentRoom.current === room)
        leave(
          "Couldn’t connect. Check that the local LiveKit server is running and try again.",
        );
    }
  }

  async function toggleDevice(device: "camera" | "microphone") {
    const room = currentRoom.current;
    if (!room || devicePending || status !== "connected") return;
    setDevicePending(true);
    setError("");
    try {
      if (device === "camera") {
        const publication =
          await room.localParticipant.setCameraEnabled(!camera);
        if (currentRoom.current !== room) {
          publication?.track?.stop();
          return;
        }
        if (localVideo.current) {
          if (!camera) publication?.track?.attach(localVideo.current);
          else localVideo.current.srcObject = null;
        }
        setCamera(!camera);
      } else {
        const publication =
          await room.localParticipant.setMicrophoneEnabled(!microphone);
        if (currentRoom.current !== room) {
          publication?.track?.stop();
          return;
        }
        setMicrophone(!microphone);
      }
    } catch {
      if (currentRoom.current === room)
        setError(`Couldn’t change your ${device}. Text is still available.`);
    } finally {
      if (currentRoom.current === room) setDevicePending(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const room = currentRoom.current;
    const text = draft.trim();
    if (!room || status !== "connected" || !text) return;
    try {
      await room.localParticipant.publishData(new TextEncoder().encode(text), {
        reliable: true,
        topic: chatTopic,
      });
      if (currentRoom.current === room) {
        appendMessage("You", text);
        setDraft((pending) => (pending === draft ? "" : pending));
      }
    } catch {
      if (currentRoom.current === room)
        setError("Couldn’t send your message. Try again when connected.");
    }
  }

  const connected = status === "connected";
  const normalizedCode = roomCode.trim().toLowerCase();

  return (
    <main className={styles.app}>
      <div className={styles.labWrap}>
        <Link href="/telehealth/preview">Back to practice visit</Link>
        <h1>Local media lab</h1>
        <p>
          Test LiveKit with two tabs on this computer. Use sample text and share
          your camera or microphone only when you choose.
        </p>
        <section className={styles.card}>
          <h2>Room</h2>
          <p role="status">
            {status === "idle"
              ? "Disconnected"
              : status === "connecting"
                ? "Connecting…"
                : status === "reconnecting"
                  ? "Reconnecting…"
                  : `Connected · ${peerCount} other ${peerCount === 1 ? "participant" : "participants"}`}
          </p>
          <form
            className={styles.messageForm}
            onSubmit={(event) => {
              event.preventDefault();
              void connect(normalizedCode);
            }}
          >
            <label htmlFor="lab-room-code">Local room code</label>
            <input
              id="lab-room-code"
              autoComplete="off"
              spellCheck={false}
              value={roomCode}
              maxLength={32}
              readOnly={status !== "idle"}
              onChange={(event) => setRoomCode(event.target.value)}
            />
            {status === "idle" && (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() =>
                    void connect(crypto.randomUUID().replaceAll("-", ""))
                  }
                >
                  Create local room
                </button>
                <button
                  type="submit"
                  className={`${styles.button} ${styles.secondary}`}
                  disabled={!codePattern.test(normalizedCode)}
                >
                  Join local room
                </button>
              </div>
            )}
          </form>
          {status !== "idle" && (
            <>
              <p>Enter this room code in a second tab on this computer.</p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.secondary}`}
                  aria-pressed={camera}
                  disabled={!connected || devicePending}
                  onClick={() => void toggleDevice("camera")}
                >
                  Camera
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.secondary}`}
                  aria-pressed={microphone}
                  disabled={!connected || devicePending}
                  onClick={() => void toggleDevice("microphone")}
                >
                  Microphone
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.secondary}`}
                  disabled={!connected}
                  onClick={() => {
                    void currentRoom.current
                      ?.startAudio()
                      .catch(() =>
                        setError(
                          "Your browser couldn’t start audio. Text is available.",
                        ),
                      );
                  }}
                >
                  Enable playback
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.danger}`}
                  onClick={() => leave()}
                >
                  Leave local room
                </button>
              </div>
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </section>

        <div className={styles.flowGrid} hidden={status === "idle"}>
          <section className={styles.card}>
            <h2>Local media</h2>
            <video
              className={styles.labVideo}
              ref={localVideo}
              autoPlay
              muted
              playsInline
              aria-label="Your camera preview"
              hidden={!camera}
            />
            <div
              ref={mediaBox}
              className={styles.labMedia}
              aria-label="Peer media"
            />
            <p>Your camera and microphone start off.</p>
          </section>

          <section className={styles.card}>
            <h2 id="lab-chat">Local text channel</h2>
            <div
              className={styles.chatLog}
              role="log"
              aria-labelledby="lab-chat"
            >
              <ol>
                {messages.map((message) => (
                  <li key={message.id}>
                    <strong>{message.speaker}</strong>
                    <p>{message.text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <form
              className={styles.messageForm}
              onSubmit={(event) => void send(event)}
            >
              <label htmlFor="lab-message">Your message</label>
              <textarea
                id="lab-message"
                rows={2}
                value={draft}
                maxLength={maxMessageLength}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button
                type="submit"
                className={styles.button}
                disabled={!connected || !draft.trim()}
              >
                Send to peer
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
