
import React, { useState } from 'react';

interface Step {
  title: string;
  description: string;
  icon: string;
  accent: string;
}

const steps: Step[] = [
  {
    title: "SUCCESS CLASS | ORBIT",
    description: "Welcome to the high-performance AI conversational environment. Precision and intelligence synchronized.",
    icon: "auto_awesome",
    accent: "var(--gold)"
  },
  {
    title: "THE GRID INTERFACE",
    description: "Launch orbits or connect to existing sessions through our reactive bento grid. Whitelisted to EBURON.AI.",
    icon: "grid_view",
    accent: "#43e97b"
  },
  {
    title: "HARDWARE CALIBRATION",
    description: "Adjust your studio lighting and optic feed to professional standards before entering the Core.",
    icon: "settings_input_component",
    accent: "#00d2ff"
  },
  {
    title: "THE INTELLIGENT CORE",
    description: "Speak naturally. The Orbit Core calculates and responds in real-time, driving your success session forward.",
    icon: "radio_button_checked",
    accent: "var(--gold)"
  }
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('orbit_onboarding_complete', 'true');
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="onboarding-overlay fade-in">
      <div className="onboarding-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-dim)' }}>
            PROTOCOL 0{currentStep + 1} / 04
          </span>
          <button 
            onClick={onComplete}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.7rem' }}
          >
            SKIP
          </button>
        </div>

        <div className="onboarding-body" key={currentStep}>
          <div className="onboarding-icon-container" style={{ color: step.accent }}>
            <span className="icon-large">{step.icon}</span>
            <div className="icon-glow" style={{ background: step.accent }}></div>
          </div>
          <h2 style={{ letterSpacing: '2px' }}>{step.title}</h2>
          <p>{step.description}</p>
        </div>

        <div className="onboarding-footer">
          <div className="step-indicators">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`indicator ${i === currentStep ? 'active' : ''}`}
                style={{ backgroundColor: i === currentStep ? step.accent : 'rgba(255,255,255,0.1)' }}
              />
            ))}
          </div>
          <button 
            className="next-btn" 
            onClick={handleNext} 
            style={{ backgroundColor: step.accent, boxShadow: `0 10px 30px ${step.accent}44` }}
          >
            {currentStep === steps.length - 1 ? 'GET STARTED' : 'CONTINUE'}
          </button>
        </div>
      </div>
    </div>
  );
}
