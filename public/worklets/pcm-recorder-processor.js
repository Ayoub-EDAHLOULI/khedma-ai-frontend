// AudioWorklet processor that resamples mic input to 16kHz and posts
// raw Int16 PCM frames back to the main thread for Gemini Live's
// sendRealtimeInput (which expects 16-bit PCM, 16kHz, little-endian).
class PcmRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.inputSampleRate = sampleRate; // AudioWorkletGlobalScope, the context's actual rate
    this.targetSampleRate = 16000;
    this.ratio = this.inputSampleRate / this.targetSampleRate;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    const outLength = Math.floor(channel.length / this.ratio);
    const pcm16 = new Int16Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIndex = Math.floor(i * this.ratio);
      const sample = Math.max(-1, Math.min(1, channel[srcIndex]));
      pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    return true;
  }
}

registerProcessor("pcm-recorder-processor", PcmRecorderProcessor);
