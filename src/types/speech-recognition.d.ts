// The Web Speech API's SpeechRecognition (speech-to-text) interface is not part of
// TypeScript's bundled DOM lib (unlike SpeechSynthesis, which is) — it's still
// non-standard/vendor-prefixed across browsers. Minimal declarations for what we use.

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare let SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};
