/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
const AudioRecordingWorklet = `
class AudioProcessingWorklet extends AudioWorkletProcessor {
  // send and clear buffer every 2048 samples, 
  // which at 16khz is about 8 times a second
  buffer = new Int16Array(2048);
  bufferWriteIndex = 0;
  
  volume = 0;
  updateIntervalInMS = 25;
  nextUpdateFrame = 25;
  isRecording = false;

  constructor() {
    super();
    this.port.onmessage = (event) => {
      if (event.data.recording !== undefined) {
        this.isRecording = event.data.recording;
      }
      if (event.data.updateIntervalInMS) {
        this.updateIntervalInMS = event.data.updateIntervalInMS;
      }
    };
  }

  get intervalInFrames() {
    return (this.updateIntervalInMS / 1000) * sampleRate;
  }

  process(inputs) {
    if (inputs[0].length) {
      const channel0 = inputs[0][0];
      
      // 1. Volume calculation (RMS)
      let sum = 0;
      for (let i = 0; i < channel0.length; i++) {
        sum += channel0[i] * channel0[i];
      }
      const rms = Math.sqrt(sum / channel0.length);
      this.volume = Math.max(rms, this.volume * 0.7);

      this.nextUpdateFrame -= channel0.length;
      if (this.nextUpdateFrame < 0) {
        this.nextUpdateFrame += this.intervalInFrames;
        this.port.postMessage({ volume: this.volume });
      }

      // 2. PCM16 Recording
      if (this.isRecording) {
        for (let i = 0; i < channel0.length; i++) {
          const int16Value = channel0[i] * 32768;
          this.buffer[this.bufferWriteIndex++] = int16Value;
          if (this.bufferWriteIndex >= this.buffer.length) {
            this.sendAndClearBuffer();
          }
        }
      }
    }
    return true;
  }

  sendAndClearBuffer() {
    this.port.postMessage({
      event: "chunk",
      data: {
        int16arrayBuffer: this.buffer.slice(0, this.bufferWriteIndex).buffer,
      },
    }, [this.buffer.slice(0, this.bufferWriteIndex).buffer]);
    this.bufferWriteIndex = 0;
  }
}
`;

export default AudioRecordingWorklet;
