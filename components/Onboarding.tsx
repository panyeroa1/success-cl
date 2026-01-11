
import React, { useState } from 'react';

interface Step {
  title: string;
  description: string;
  icon: string;
  accent: string;
}

const steps: Step[] = [
  {
    title: "WELCOME TO ORBIT PLATFORM",
    description: "You have entered a high-performance conversational environment designed for Success Class. Powered by the Orbit Platform AI.",
    icon: "auto_awesome",
    accent: "var(--gold)"
  },
  {
    title: "THE SUCCESS CLASS PORTAL",
    description: "Launch instant sessions, join existing orbits, or schedule masterclasses through our intuitive grid.",
    icon: "grid_view",
    accent: "#43e97b"
  },
  {
    title: "HARDWARE SYNC",
    description: "Calibrate your studio lighting and audio hardware before taking the floor. Precision is our baseline.",
    icon: "settings_input_component",
    accent: "#00d2ff"
  },
  {
    title: "THE INTELLIGENT CORE",
    description: "Interact with the Orbit Platform, a reactive AI model that responds to your voice in real-time.",
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

  const handleSkip = () => {
    localStorage.setItem('orbit_onboarding_complete', 'true');
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <div className="onboarding-overlay fade-in">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <span className="step-count">STEP 0{currentStep + 1} / 04</span>
          <button className="skip-btn" onClick={handleSkip}>SKIP</button>
        </div>

        <div className="onboarding-body" key={currentStep}>
          <div className="onboarding-icon-container" style={{ color: step.accent }}>
            <span className="icon-large">{step.icon}</span>
            <div className="icon-glow" style={{ background: step.accent }}></div>
          </div>
          <h2>{step.title}</h2>
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
          <button className="next-btn" onClick={handleNext} style={{ backgroundColor: step.accent }}>
            {currentStep === steps.length - 1 ? 'GET STARTED' : 'CONTINUE'}
          </button>
        </div>
      </div>
    </div>
  );
}
