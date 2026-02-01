
import React from 'react';
import { BotState } from '../types';

interface RobotFaceProps {
  state: BotState;
  isSquinting: boolean;
}

const RobotFace: React.FC<RobotFaceProps> = ({ state, isSquinting }) => {
  const eyeColor = state === BotState.THINKING ? '#9b59b6' : 
                   state === BotState.LISTENING ? '#2ecc71' : 
                   state === BotState.DESTRUCTING ? '#e74c3c' : '#5dade2';

  const lidHeight = isSquinting ? 35 : 15;

  return (
    <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {/* Left Eye */}
        <g className="eye-anim">
          <circle cx="140" cy="200" r="30" fill={eyeColor} className="transition-colors duration-300 shadow-lg" />
          <rect x="100" y="150" width="80" height={lidHeight} fill="#050505" className="transition-all duration-300" />
        </g>
        
        {/* Right Eye */}
        <g className="eye-anim">
          <circle cx="260" cy="200" r="30" fill={eyeColor} className="transition-colors duration-300 shadow-lg" />
          <rect x="220" y="150" width="80" height={lidHeight} fill="#050505" className="transition-all duration-300" />
        </g>

        {/* Mouth (Glow when speaking) */}
        {state === BotState.SPEAKING && (
          <rect x="150" y="280" width="100" height="4" fill={eyeColor} className="animate-pulse" />
        )}
      </svg>
    </div>
  );
};

export default RobotFace;
