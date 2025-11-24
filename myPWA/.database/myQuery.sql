DROP TABLE songs;
CREATE TABLE IF NOT EXISTS songs (
    songName TEXT,
    artistName TEXT,
    genre TEXT,
    releaseDate INTEGER
);

INSERT INTO songs(songName,artistName,genre,releaseDate) 
VALUES 
    ('Pain','PinkPantheress','UK Garage',2021), 
    ('Break It Off','PinkPantheress','UK Garage',2021); 
SELECT * FROM songs;