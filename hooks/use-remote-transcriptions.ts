import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings, useLogStore } from '../lib/state';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';

export function useRemoteTranscriptions() {
  const { isWatchingRemote, remoteMeetingId } = useSettings();
  const { client, connected } = useLiveAPIContext();

  useEffect(() => {
    if (!isWatchingRemote || !connected || !remoteMeetingId) return;

    console.log(`Subscribing to remote transcriptions for meeting: ${remoteMeetingId}`);

    const channel = supabase
      .channel(`transcriptions_changes_${remoteMeetingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transcriptions',
          filter: `meeting_id=eq.${remoteMeetingId}`,
        },
        (payload) => {
          const text = payload.new.transcribe_text_segment || payload.new.full_transcription;
          if (text) {
            console.log('Remote transcription received:', text);
            
            // Add to log store as a system notification
            useLogStore.getState().addTurn({
              role: 'system',
              text: `[Remote Transcription]: ${text}`,
              isFinal: true,
            });

            // Send to Gemini as a user prompt
            try {
              client.send([{ text }]);
            } catch (err) {
              console.error('Failed to send remote transcription to Gemini:', err);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Supabase transcription subscription status: ${status}`);
      });

    return () => {
      console.log(`Unsubscribing from transcriptions for meeting: ${remoteMeetingId}`);
      supabase.removeChannel(channel);
    };
  }, [isWatchingRemote, remoteMeetingId, client, connected]);
}
