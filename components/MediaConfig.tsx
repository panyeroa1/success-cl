import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '../lib/state';

export default function MediaConfig() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { 
    setPhase, 
    mirrorVideo, 
    setMirrorVideo, 
    studioAudio, 
    setStudioAudio, 
    lightingIntensity, 
    setLightingIntensity,
    meetingRole
  } = useSettings();

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState('');

  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) setSelectedVideo(videoDevices[0].deviceId);
      } catch (err) {
        console.error("Media setup failed", err);
      }
    }
    setupMedia();
    
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleStart = () => {
    setPhase('room');
  };

  const videoFilter = `brightness(${0.5 + lightingIntensity / 100}) contrast(${0.8 + lightingIntensity / 100}) saturate(${0.9 + lightingIntensity / 200})`;

  return (
    <div className="config-screen fade-in">
      <div className="config-header">
        <h1 className="portal-title-mini">HARDWARE <span>SYNC</span></h1>
        <button className="back-btn-circle" onClick={() => setPhase('portal')}>
          <span className="icon">arrow_back</span>
        </button>
      </div>

      <div className="config-layout">
        <div className="preview-container">
          <div className="video-glass-frame">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={mirrorVideo ? 'mirrored' : ''}
              style={{ filter: videoFilter }}
            />
            <div className="video-status-overlay">
              <span className="dot online"></span>
              <span className="label">ENCRYPTED FEED</span>
            </div>
          </div>
        </div>

        <div className="controls-panel">
          <div className="control-section">
            <h3>Camera Device</h3>
            <select className="config-select" value={selectedVideo} onChange={(e) => setSelectedVideo(e.target.value)}>
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || 'Standard Camera'}</option>
              ))}
            </select>
          </div>

          <div className="control-grid">
            <div className={`config-toggle-tile ${mirrorVideo ? 'active' : ''}`} onClick={() => setMirrorVideo(!mirrorVideo)}>
              <span className="icon">flip</span>
              <span className="label">Mirror</span>
            </div>
            <div className={`config-toggle-tile ${studioAudio ? 'active' : ''}`} onClick={() => setStudioAudio(!studioAudio)}>
              <span className="icon">mic_external_on</span>
              <span className="label">Studio Audio</span>
            </div>
          </div>

          <div className="control-section">
            <div className="label-row">
              <h3>Lighting Studio</h3>
              <span>{lightingIntensity}%</span>
            </div>
            <input 
              type="range" 
              className="config-slider"
              min="0" 
              max="100" 
              value={lightingIntensity} 
              onChange={(e) => setLightingIntensity(parseInt(e.target.value))}
            />
          </div>

          <button className="btn-join-platform" onClick={handleStart}>
            {meetingRole === 'transcriber' ? 'START SESSION' : 'JOIN SESSION'}
          </button>
        </div>
      </div>
    </div>
  );
}