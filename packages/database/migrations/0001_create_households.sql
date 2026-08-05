BEGIN;

CREATE TABLE households (
  id text PRIMARY KEY,
  country text NOT NULL CHECK (country IN ('KE', 'GH', 'ZA')),
  programme_id text NOT NULL,
  facility_id text,
  assignment_id text NOT NULL,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id LIKE country || '\_%' ESCAPE '\'),
  CHECK (programme_id LIKE country || '\_%' ESCAPE '\'),
  CHECK (facility_id IS NULL OR facility_id LIKE country || '\_%' ESCAPE '\'),
  CHECK (assignment_id LIKE country || '\_%' ESCAPE '\')
);

CREATE INDEX households_scope_idx
  ON households (country, programme_id, facility_id, assignment_id);

COMMIT;
