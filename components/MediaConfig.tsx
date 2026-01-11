
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
        console.error("Media sync failed", err);
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
        <h1>HARDWARE <span>SYNC</span></h1>
        <button 
          className="tile" 
          onClick={() => setPhase('portal')}
          style={{ padding: '12px', borderRadius: '50%', flexDirection: 'row' }}
        >
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
              <span className="label" style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px' }}>
                CALIBRATING FEED...
              </span>
            </div>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '16px', textAlign: 'center' }}>
            WHITELISTED TO EBURON.AI | ORBIT CORE SYNC ACTIVE
          </p>
        </div>

        <div className="controls-panel">
          <div className="control-section">
            <h3>Optic Input</h3>
            <select className="config-select" value={selectedVideo} onChange={(e) => setSelectedVideo(e.target.value)}>
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || 'Standard Optic'}</option>
              ))}
            </select>
          </div>

          <div className="bento" style={{ marginTop: '0' }}>
            <div className={`config-toggle-tile ${mirrorVideo ? 'active' : ''}`} onClick={() => setMirrorVideo(!mirrorVideo)}>
              <span className="icon">flip</span>
              <span className="label" style={{ fontSize: '0.7rem', fontWeight: 700 }}>MIRROR</span>
            </div>
            <div className={`config-toggle-tile ${studioAudio ? 'active' : ''}`} onClick={() => setStudioAudio(!studioAudio)}>
              <span className="icon">graphic_eq</span>
              <span className="label" style={{ fontSize: '0.7rem', fontWeight: 700 }}>STUDIO</span>
            </div>
          </div>

          <div className="control-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3>Atmospheric Lighting</h3>
              <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '0.8rem' }}>{lightingIntensity}%</span>
            </div>
            <input 
              type="range" 
              className="config-slider"
              min="0" 
              max="100" 
              value={lightingIntensity} 
              onChange={(e) => setLightingIntensity(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)' }}
            />
          </div>

          <button className="btn-join-platform" onClick={handleStart}>
            {meetingRole === 'transcriber' ? 'INITIALIZE ORBIT' : 'ENTER SESSION'}
          </button>
        </div>
      </div>
    </div>
  );
}
