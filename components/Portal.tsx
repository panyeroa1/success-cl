
import React, { useState, useEffect } from 'react';
import { useSettings } from '../lib/state';
import { supabase } from '../lib/supabase';
import Onboarding from './Onboarding';

export default function Portal() {
  const { setPhase, setMeetingRole, setRemoteMeetingId, setIsWatchingRemote } = useSettings();
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [authStatus, setAuthStatus] = useState('● INITIALIZING...');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const onboardingDone = localStorage.getItem('orbit_onboarding_complete');
    if (!onboardingDone) {
      setShowOnboarding(true);
    }

    async function boot() {
      try {
        const { data } = await supabase.auth.signInAnonymously();
        if (data?.user) {
          setAuthStatus(`● ONLINE: ${data.user.id.slice(0, 8)}`);
        }
      } catch (e) {
        setAuthStatus('● OFFLINE');
      }
    }
    boot();
  }, []);

  const handleStartInstant = () => {
    const mid = "MEET-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    setRemoteMeetingId(mid);
    setMeetingRole('transcriber');
    setPhase('config');
  };

  const handleJoin = () => {
    if (joinId.trim()) {
      setRemoteMeetingId(joinId.trim());
      setMeetingRole('listener');
      setIsWatchingRemote(true);
      setPhase('config');
    }
  };

  return (
    <div className="portal-container fade-in">
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      
      <div className="container-bento">
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1>SUCCESS <span>CLASS</span></h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '8px' }}>ORBIT PLATFORM AI CORE</p>
        </header>
        
        <div className="bento">
          <div className="tile large" onClick={handleStartInstant}>
            <div className="tile-icon">🎙️</div>
            <h3>Instant Orbit</h3>
            <p>Launch session as Host</p>
          </div>
          
          {!showJoin ? (
            <div className="tile" onClick={() => setShowJoin(true)}>
              <div className="tile-icon">🔗</div>
              <div className="tile-content">
                <h3>Join Orbit</h3>
                <p>Connect to existing session</p>
              </div>
            </div>
          ) : (
            <div className="join-area fade-in" style={{ width: '100%' }}>
              <input 
                type="text" 
                placeholder="SESSION ID (MEET-XXXXXX)" 
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn-join" style={{ flex: 1 }} onClick={handleJoin}>CONNECT</button>
                <button className="btn-join" style={{ flex: 0.4, background: 'var(--glass)', color: '#fff' }} onClick={() => setShowJoin(false)}>BACK</button>
              </div>
            </div>
          )}
          
          <div className="tile" onClick={() => alert('Calendar sync coming in v2.0')}>
            <div className="tile-icon">📅</div>
            <div className="tile-content">
              <h3>Schedule</h3>
              <p>Book future classroom orbits</p>
            </div>
          </div>
        </div>

        <div id="auth-status" className={authStatus.includes('ONLINE') ? 'online' : ''} style={{ textAlign: 'center', marginTop: '40px' }}>
          {authStatus}
        </div>
      </div>
    </div>
  );
}
