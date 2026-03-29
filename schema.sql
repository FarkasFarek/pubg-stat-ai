CREATE TABLE IF NOT EXISTS matches (
  match_id    TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  shard       TEXT NOT NULL,
  played_at   TEXT NOT NULL,
  kills       INTEGER DEFAULT 0,
  deaths      INTEGER DEFAULT 0,
  assists     INTEGER DEFAULT 0,
  damage      REAL    DEFAULT 0,
  rank        INTEGER DEFAULT 0,
  headshots   INTEGER DEFAULT 0,
  map_name    TEXT    DEFAULT '',
  won         INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_player_played ON matches(player_name, played_at);
