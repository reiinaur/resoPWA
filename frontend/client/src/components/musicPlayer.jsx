import React, { useState } from 'react';
import './musicPlayer.css';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  
  return (
    <div className="music-player">
      <h2>Music Player</h2>
      <p>Current song: {currentSong || 'None'}</p>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};

export default MusicPlayer;