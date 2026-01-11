
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import cn from 'classnames';
import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from '../../../lib/audio-recorder';
import { useSettings, useTools, useLogStore } from '../../../lib/state';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

export type ControlTrayProps = {
  children?: ReactNode;
};

function ControlTray({ children }: ControlTrayProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { client, connected, connect, disconnect } = useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    if (!connected) {
      setMuted(false);
    }
  }, [connected]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on('data', onData);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off('data', onData);
    };
  }, [connected, client, muted, audioRecorder]);

  const handleMicClick = () => {
    if (connected) {
      setMuted(!muted);
    } else {
      connect();
    }
  };

  const micButtonTitle = connected
    ? muted
      ? 'Unmute microphone'
      : 'Mute microphone'
    : 'Connect and start microphone';

  return (
    <section className="control-tray fade-in">
      <div className="actions-nav">
        <button
          className={cn('action-button', { active: !muted })}
          onClick={handleMicClick}
          title={micButtonTitle}
        >
          {!muted ? (
            <span className="icon filled">mic</span>
          ) : (
            <span className="icon filled">mic_off</span>
          )}
        </button>
        <button
          className="action-button"
          onClick={useLogStore.getState().clearTurns}
          aria-label="Reset Chat"
        >
          <span className="icon">refresh</span>
        </button>
      </div>

      <div className="center-action">
        <button
          ref={connectButtonRef}
          className={cn('action-button connect-toggle', { connected })}
          onClick={connected ? disconnect : connect}
        >
          <span className="icon filled">
            {connected ? 'pause' : 'play_arrow'}
          </span>
        </button>
      </div>

      <div className="actions-nav">
        <button
          className="action-button"
          onClick={() => {
            const { turns } = useLogStore.getState();
            const logData = JSON.stringify(turns, null, 2);
            const blob = new Blob([logData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `success-class-logs-${new Date().getTime()}.json`;
            a.click();
          }}
          aria-label="Export Logs"
        >
          <span className="icon">download</span>
        </button>
      </div>
      {children}
    </section>
  );
}

export default memo(ControlTray);
