import type { SpeechRecognitionProvider, SpeechTranscript } from "@/lib/platform/speech/speech-contracts";

/** Browser Web Speech API stub wrapper — fails closed when unavailable. */
export class BrowserSpeechRecognitionProvider implements SpeechRecognitionProvider {
  readonly name = "browser-web-speech";

  isSupported(): boolean {
    return (
      typeof globalThis.window !== "undefined" &&
      ("SpeechRecognition" in globalThis.window ||
        "webkitSpeechRecognition" in globalThis.window)
    );
  }

  async start(): Promise<void> {
    if (!this.isSupported()) throw new Error("SPEECH_RECOGNITION_UNSUPPORTED");
  }

  async stop(): Promise<void> {
    // Integration deferred — contract only in Phase 13
  }

  onTranscript(_callback: (transcript: SpeechTranscript) => void): () => void {
    return () => undefined;
  }
}

export function createSpeechRecognitionProvider(): SpeechRecognitionProvider {
  return new BrowserSpeechRecognitionProvider();
}
