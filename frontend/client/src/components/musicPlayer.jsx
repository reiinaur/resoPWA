import React, { useState, useRef, useEffect } from 'react';
import './musicPlayer.css';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef(null);
  
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
    },
    { 
      id: 5, 
      title: "Song Two", 
      artist: "Artist Two", 
      duration: 195,
      playlist: "Win"
    },
    { 
      id: 6, 
      title: "Rolling Beat", 
      artist: "DJ Wave", 
      duration: 210,
      playlist: "9K Roll"
    },
    { 
      id: 7, 
      title: "Night Drive", 
      artist: "Synth Master", 
      duration: 225,
      playlist: "9K Roll"
    }
  ];

  const playlists = [
    { name: "Win", songCount: 24 },
    { name: "9K Roll", songCount: 8 },
    { name: "9K Roll", songCount: 22 },
    { name: "9K Roll", songCount: 11 },
    { name: "9K Roll", songCount: 14 },
    { name: "Blinding Lights", songCount: 3 }
  ];

  const playSong = (index) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
    
    // In a real app, you would load and play the actual audio file
    // audioRef.current.src = songs[index].audioUrl;
    // audioRef.current.play();
    
    console.log(`Now playing: ${songs[index].title} by ${songs[index].artist}`);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    if (isPlaying) {
      // audioRef.current.pause();
      console.log("Playback paused");
    } else {
      // audioRef.current.play();
      console.log("Playback resumed");
    }
  };

  const playNextSong = () => {
    const nextIndex = (currentSongIndex + 1) % songs.length;
    playSong(nextIndex);
  };

  const playPrevSong = () => {
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(prevIndex);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    
    // In a real app, you would set the audio volume
    // if (audioRef.current) {
    //   audioRef.current.volume = newVolume / 100;
    // }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getSongsByPlaylist = (playlistName) => {
    return songs.filter(song => song.playlist === playlistName);
  };

  const getUniquePlaylists = () => {
    const uniqueNames = [...new Set(playlists.map(playlist => playlist.name))];
    return uniqueNames.map(name => {
      const playlist = playlists.find(p => p.name === name);
      return { name, songCount: playlist.songCount };
    });
  };

  // Simulate progress update
  useEffect(() => {
    let interval;
    if (isPlaying) {
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
  }, [isPlaying, currentSongIndex]);

  const currentSong = songs[currentSongIndex] || { title: "No song selected", artist: "-", duration: 0 };

  return (
    <div className="music-app">
      <div className="container">
        <header>
          <h1>My Music Collection</h1>
          <p>Click the play button next to any song to start listening</p>
        </header>

        <div className="playlists">
          {getUniquePlaylists().map((playlist, index) => (
            <div key={index} className="playlist">
              <h2>{playlist.name} ({playlist.songCount} songs)</h2>
              <ul className="song-list">
                {getSongsByPlaylist(playlist.name).map((song) => (
                  <li key={song.id} className="song-item">
                    <div className="song-info">
                      <div className="song-title">{song.title}</div>
                      <div className="song-artist">{song.artist}</div>
                    </div>
                    <button 
                      className="play-btn"
                      onClick={() => playSong(songs.findIndex(s => s.id === song.id))}
                    >
                      ▶
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden audio element for actual implementation */}
      <audio ref={audioRef} />

      {/* Music Player */}
      <div className={`music-player ${isExpanded ? 'expanded' : ''}`}>
        <div className="player-footer">
          <div className="player-left">
            <button 
              className="expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▼' : '▲'}
            </button>
            <div className="song-details">
              <div className="song-name">{currentSong.title}</div>
              <div className="artist-name">{currentSong.artist}</div>
            </div>
          </div>
          <div className="volume-control">
            <span>🔊</span>
            <input 
              type="range" 
              className="volume-slider" 
              min="0" 
              max="100" 
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
        </div>
        
        <div className="player-expanded">
          <div className="album-art">♪</div>
          <div className="expanded-song-details">
            <div className="expanded-song-name">{currentSong.title}</div>
            <div className="expanded-artist-name">{currentSong.artist}</div>
          </div>
          
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${(currentTime / currentSong.duration) * 100}%` }}
              ></div>
            </div>
            <div className="time-info">
              <span className="current-time">{formatTime(currentTime)}</span>
              <span className="total-time">{formatTime(currentSong.duration)}</span>
            </div>
          </div>
          
          <div className="player-controls">
            <button className="control-btn prev-btn" onClick={playPrevSong}>
              ⏮
            </button>
            <button className="control-btn play-pause" onClick={togglePlayPause}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="control-btn next-btn" onClick={playNextSong}>
              ⏭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;