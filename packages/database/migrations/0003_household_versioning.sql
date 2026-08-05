ALTER TABLE households
  ADD COLUMN version integer NOT NULL DEFAULT 1,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE households
  ADD CONSTRAINT households_version_positive CHECK (version > 0);

CREATE INDEX households_scope_version_idx
  ON households (country, programme_id, facility_id, assignment_id, household_id, version);
