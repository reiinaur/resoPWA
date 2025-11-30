import React, { useState, useRef, useEffect } from 'react';
import './musicPlayer.css';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  
  const songs = [
    { 
      id: 1, 
      title: "Blinding Lights", 
      artist: "The Weeknd", 
      duration: 200,
      playlist: "Blinding Lights"
    },
    { 
      id: 2, 
      title: "Save Your Tears", 
      artist: "The Weeknd", 
      duration: 215,
      playlist: "Blinding Lights"
    },
    { 
      id: 3, 
      title: "Starboy", 
      artist: "The Weeknd ft. Daft Punk", 
      duration: 230,
      playlist: "Blinding Lights"
    },
    { 
      id: 4, 
      title: "Song One", 
      artist: "Artist One", 
      duration: 180,
      playlist: "Win"
    }
  ];

  const playSong = (index) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
    setShowPlayer(true);
    console.log(`Now playing: ${songs[index].title} by ${songs[index].artist}`);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const playNextSong = () => {
    const nextIndex = (currentSongIndex + 1) % songs.length;
    setCurrentSongIndex(nextIndex);
    setIsPlaying(true);
  };

  const playPrevSong = () => {
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    setCurrentSongIndex(prevIndex);
    setIsPlaying(true);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseInt(e.target.value));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const closePlayer = () => {
    setShowPlayer(false);
    setIsPlaying(false);
  };

  // Simulate progress update
  useEffect(() => {
    let interval;
    if (isPlaying && showPlayer) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= songs[currentSongIndex].duration) {
            playNextSong();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentSongIndex, showPlayer]);

  const currentSong = songs[currentSongIndex] || { title: "No song selected", artist: "-", duration: 0 };

  return (
    <div className="music-app">
      {/* Footer Music Bar */}
      <div className="music-bar">
        <div className="bar-content">
          <div className="now-playing">
            <span className="bar-song">{currentSong.title}</span>
            <span className="bar-artist">{currentSong.artist}</span>
          </div>
          <button 
            className="open-player-btn"
            onClick={() => setShowPlayer(true)}
            disabled={!currentSong.title}
          >
            Open Player
          </button>
        </div>
      </div>

      {/* Floating Music Player Popup */}
      {showPlayer && (
        <div className="music-popup">
          <div className="popup-content">
            {/* Header with close button */}
            <div className="popup-header">
              <button className="close-btn" onClick={closePlayer}>×</button>
            </div>
            
            {/* Album Art - Spinning CD */}
            <div className={`album-art ${isPlaying ? 'spinning' : ''}`}>
              <div className="cd-center"></div>
            </div>
            
            {/* Song Info */}
            <div className="song-info-popup">
              <h2 className="popup-song-title">{currentSong.title}</h2>
              <p className="popup-song-artist">{currentSong.artist}</p>
            </div>
            
            {/* Progress Bar */}
            <div className="progress-section">
              <div className="progress-bar-popup">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(currentTime / currentSong.duration) * 100}%` }}
                ></div>
              </div>
              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(currentSong.duration)}</span>
              </div>
            </div>
            
            {/* Controls */}
            <div className="controls-popup">
              <button className="control-btn prev" onClick={playPrevSong}>
                ⏮
              </button>
              <button className="control-btn play-pause" onClick={togglePlayPause}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="control-btn next" onClick={playNextSong}>
                ⏭
              </button>
            </div>
            
            {/* Volume Control */}
            <div className="volume-popup">
              <span>🔊</span>
              <input 
                type="range" 
                className="volume-slider-popup" 
                min="0" 
                max="100" 
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;