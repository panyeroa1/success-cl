
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './WelcomeScreen.css';
// FIX: Import Template type from lib/types instead of lib/state to fix "locally declared but not exported" error
import { useTools } from '../../../lib/state';
import { Template } from '../../../lib/types';

const welcomeContent: Record<Template, { title: string; description: string; prompts: string[] }> = {
  'customer-support': {
    title: 'Orbit Support',
    description: 'Experience how Orbit Platform handles inquiries and triggers specialized functions in real-time.',
    prompts: [
      "I'd like to return an item.",
      "What's the status of my order?",
      'Can I speak to a representative?',
    ],
  },
  'personal-assistant': {
    title: 'Orbit Assistant',
    description: 'The Orbit Platform core manages your masterclass schedule and master-level tasks.',
    prompts: [
      'Create a calendar event for a meeting tomorrow at 10am.',
      'Send an email to jane@example.com.',
      'Set a reminder to buy milk.',
    ],
  },
  'navigation-system': {
    title: 'Orbit Navigation',
    description: 'Navigate complex environments using the Orbit Platform geographic mapping engine.',
    prompts: [
      'Find a route to the nearest coffee shop.',
      'Are there any parks nearby?',
      "What's the traffic like on the way to the airport?",
    ],
  },
};

const WelcomeScreen: React.FC = () => {
  const { template, setTemplate } = useTools();
  const { title, description, prompts } = welcomeContent[template];
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="title-container">
          <span className="welcome-icon">mic</span>
          <div className="title-selector">
            <select value={template} onChange={(e) => setTemplate(e.target.value as Template)} aria-label="Select a template">
              <option value="customer-support">Orbit Support</option>
              <option value="personal-assistant">Orbit Assistant</option>
              <option value="navigation-system">Orbit Navigation</option>
            </select>
            <span className="icon">arrow_drop_down</span>
          </div>
        </div>
        <p>{description}</p>
        <div className="example-prompts">
          {prompts.map((prompt, index) => (
            <div key={index} className="prompt">{prompt}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
