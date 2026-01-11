/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import AudioRecordingWorklet from './audio-processing';

// Centralized approach: vol-meter uses the same unified processor source
const VolMeterWorket = AudioRecordingWorklet;

export default VolMeterWorket;
