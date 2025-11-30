CREATE TABLE songs (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  artist VARCHAR,
  album VARCHAR,
  spotify_url VARCHAR
);

CREATE TABLE playlists (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  description TEXT
);

CREATE TABLE playlist_songs (
  playlist_id VARCHAR,
  song_id VARCHAR,
  PRIMARY KEY(playlist_id, song_id),
  FOREIGN KEY(playlist_id) REFERENCES playlists(id),
  FOREIGN KEY(song_id) REFERENCES songs(id)
);
