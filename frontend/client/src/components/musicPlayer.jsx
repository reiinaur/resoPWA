import { useState, useRef, useEffect } from 'react';
import './musicPlayer.css';

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  
  const audioRef = useRef(null);

  useEffect(() => {
    setCurrentTrack({
      id: '1',
      name: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      image: 'https://i.scdn.co/image/ab67616d00001e02b6d4566db0d12894a1a3b8a2',
      preview_url: 'https://p.scdn.co/mp3-preview/...' 
    });
  }, []);

  const togglePlay = () => {
    if (currentTrack?.preview_url) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
    setDuration(e.target.duration || 0);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.preview_url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={handleTimeUpdate}
      />
      
      <div className={`music-player ${isExpanded ? 'expanded' : ''}`}>
        {/* Mini Player */}
        <div className="mini-player">
          <div className="track-info-mini">
            {currentTrack.image && (
              <img 
                src={currentTrack.image} 
                alt={currentTrack.name}
                className="track-image-mini"
              />
            )}
            <div className="track-details-mini">
              <span className="track-name-mini">{currentTrack.name}</span>
              <span className="track-artist-mini">{currentTrack.artist}</span>
            </div>
          </div>
          
          <div className="player-controls">
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>
          </div>

          <button 
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>

        {/* Expanded Player */}
        {isExpanded && (
          <div className="expanded-player">
            <div className="expanded-track-info">
              {currentTrack.image && (
                <img 
                  src={currentTrack.image} 
                  alt={currentTrack.name}
                  className="expanded-track-image"
                />
              )}
              <div className="expanded-track-details">
                <h3 className="expanded-track-name">{currentTrack.name}</h3>
                <p className="expanded-track-artist">{currentTrack.artist}</p>
                <p className="expanded-track-album">{currentTrack.album}</p>
              </div>
            </div>

            <div className="playback-controls">
              <div className="progress-container">
                <span className="time-current">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="progress-bar"
                />
                <span className="time-total">{formatTime(duration)}</span>
              </div>

              <div className="control-buttons">
                <button className="control-btn secondary">⏮️</button>
                <button className="control-btn primary" onClick={togglePlay}>
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <button className="control-btn secondary">⏭️</button>
              </div>
            </div>

            <div className="volume-controls">
              <span className="volume-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
              <span className="volume-percent">{volume}%</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}