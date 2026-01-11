
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState, useMemo } from 'react';
import PopUp from '../popup/PopUp';
import { Modality, LiveServerContent } from '@google/genai';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import {
  useSettings,
  useLogStore,
  useTools,
} from '../../../lib/state';
import { supabase } from '../../../lib/supabase';

type AIStatus = 'READY' | 'LISTENING' | 'CALCULATING' | 'EMITTING';

export default function StreamingConsole() {
  const { client, setConfig, volume, connected } = useLiveAPIContext();
  const { systemPrompt, voice, meetingRole, remoteMeetingId } = useSettings();
  const { tools } = useTools();
  const turns = useLogStore(state => state.turns);
  const [showPopUp, setShowPopUp] = useState(true);

  // Persistence tracking for real-time streaming
  const activeRowIdRef = useRef<string | null>(null);
  const activeTurnKeyRef = useRef<number>(0);
  const lastSyncedTextRef = useRef<string>("");
  const isSyncingRef = useRef<boolean>(false);

  // Derive Orbit Core Status from conversation state
  const aiStatus = useMemo((): AIStatus => {
    if (!connected) return 'READY';
    
    const lastTurn = turns[turns.length - 1];
    if (!lastTurn) return 'READY';

    // If Core is currently emitting audio/content
    if (lastTurn.role === 'agent' && !lastTurn.isFinal) return 'EMITTING';
    if (volume > 0.05) return 'EMITTING';

    // If user is currently speaking (transcription in progress)
    if (lastTurn.role === 'user' && !lastTurn.isFinal) return 'LISTENING';

    // If user just finished speaking but Core hasn't started yet
    if (lastTurn.role === 'user' && lastTurn.isFinal) return 'CALCULATING';

    return 'READY';
  }, [turns, connected, volume]);

  /**
   * REAL-TIME PERSISTENCE LOGIC
   * Streams partial and final transcription text to Supabase.
   */
  useEffect(() => {
    if (meetingRole !== 'transcriber' || !remoteMeetingId || turns.length === 0) return;

    const lastTurn = turns[turns.length - 1];
    if (lastTurn.role === 'system' || !lastTurn.text.trim()) return;

    const turnKey = lastTurn.timestamp.getTime();

    // Check if we need to sync
    if (turnKey === activeTurnKeyRef.current && lastTurn.text === lastSyncedTextRef.current) {
      return;
    }

    // New Turn detected
    if (turnKey !== activeTurnKeyRef.current) {
      activeRowIdRef.current = null;
      activeTurnKeyRef.current = turnKey;
      lastSyncedTextRef.current = "";
    }

    // Prevent overlapping syncs for the same segment
    if (isSyncingRef.current) return;

    const syncTranscription = async () => {
      isSyncingRef.current = true;
      const textToSync = lastTurn.text;

      try {
        if (activeRowIdRef.current) {
          // Update existing partial record
          await supabase
            .from('transcriptions')
            .update({
              transcribe_text_segment: textToSync,
              full_transcription: textToSync,
            })
            .eq('id', activeRowIdRef.current);
          
          lastSyncedTextRef.current = textToSync;
        } else {
          // Create new record and capture the ID for future updates in this turn
          const { data, error } = await supabase
            .from('transcriptions')
            .insert({
              meeting_id: remoteMeetingId,
              transcribe_text_segment: textToSync,
              full_transcription: textToSync,
              speaker: lastTurn.role,
              created_at: lastTurn.timestamp.toISOString()
            })
            .select();

          if (!error && data && data[0]) {
            activeRowIdRef.current = data[0].id;
            lastSyncedTextRef.current = textToSync;
          }
        }
      } catch (err) {
        console.error('[Orbit Stream Sync Error]:', err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    syncTranscription();
  }, [turns, meetingRole, remoteMeetingId]);

  useEffect(() => {
    const enabledTools = tools
      .filter(tool => tool.isEnabled)
      .map(tool => ({
        functionDeclarations: [
          {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        ],
      }));

    const config: any = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice,
          },
        },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      tools: enabledTools,
    };
    setConfig(config);
  }, [setConfig, systemPrompt, tools, voice]);

  useEffect(() => {
    const { addTurn, updateLastTurn } = useLogStore.getState();

    const handleInputTranscription = (text: string, isFinal: boolean) => {
      const currentTurns = useLogStore.getState().turns;
      const last = currentTurns[currentTurns.length - 1];
      if (last && last.role === 'user' && !last.isFinal) {
        updateLastTurn({ text: last.text + text, isFinal });
      } else {
        addTurn({ role: 'user', text, isFinal });
      }
    };

    const handleOutputTranscription = (text: string, isFinal: boolean) => {
      const currentTurns = useLogStore.getState().turns;
      const last = currentTurns[currentTurns.length - 1];
      if (last && last.role === 'agent' && !last.isFinal) {
        updateLastTurn({ text: last.text + text, isFinal });
      } else {
        addTurn({ role: 'agent', text, isFinal });
      }
    };

    const handleContent = (serverContent: LiveServerContent) => {
      const text = serverContent.modelTurn?.parts?.map((p: any) => p.text).filter(Boolean).join(' ') ?? '';
      if (!text) return;
      const currentTurns = useLogStore.getState().turns;
      const last = currentTurns[currentTurns.length - 1];
      if (last?.role === 'agent' && !last.isFinal) {
        updateLastTurn({ text: last.text + text });
      } else {
        addTurn({ role: 'agent', text, isFinal: false });
      }
    };

    const handleTurnComplete = () => {
      const currentTurns = useLogStore.getState().turns;
      const last = currentTurns[currentTurns.length - 1];
      if (last && !last.isFinal) {
        updateLastTurn({ isFinal: true });
      }
    };

    client.on('inputTranscription', handleInputTranscription);
    client.on('outputTranscription', handleOutputTranscription);
    client.on('content', handleContent);
    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('inputTranscription', handleInputTranscription);
      client.off('outputTranscription', handleOutputTranscription);
      client.off('content', handleContent);
      client.off('turncomplete', handleTurnComplete);
    };
  }, [client]);

  const orbScale = connected ? 1 + (volume * 1.5) : 1;
  const orbGlow = connected ? `0 0 ${40 + (volume * 100)}px var(--gold-glow)` : `0 0 20px rgba(255,255,255,0.1)`;

  return (
    <div className={`orb-platform-container fade-in state-${aiStatus.toLowerCase()}`}>
      {showPopUp && <PopUp onClose={() => setShowPopUp(false)} />}
      
      <div className="platform-status-badge">
        <span className="status-dot"></span>
        <span className="status-text">{aiStatus}</span>
      </div>

      <div className="orb-centerpiece">
        <div 
          className={`main-orb orb-${aiStatus.toLowerCase()}`} 
          style={{ 
            transform: `scale(${orbScale})`,
            boxShadow: orbGlow
          }}
        >
          <div className="orb-core"></div>
          {(aiStatus === 'CALCULATING' || aiStatus === 'EMITTING') && <div className="orb-loader-ring"></div>}
        </div>
      </div>

      <div className="transcription-overlay">
        {turns.slice(-2).map((t, i) => (
          <div key={i} className={`minimal-turn ${t.role}`}>
             <p>{t.text}</p>
          </div>
        ))}
      </div>

      {!connected && (
        <div style={{ color: 'var(--gold)', fontSize: '0.7rem', letterSpacing: '2px', fontWeight: 800, marginTop: '20px' }}>
          ORBIT PLATFORM CORE READY
        </div>
      )}
    </div>
  );
}
