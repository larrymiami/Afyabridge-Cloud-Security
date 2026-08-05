CREATE TABLE sync_devices (
  device_id text PRIMARY KEY,
  actor_id text NOT NULL,
  country text NOT NULL CHECK (country IN ('KE', 'GH', 'ZA')),
  programme_id text NOT NULL,
  facility_id text,
  assignment_ids text[] NOT NULL DEFAULT '{}',
  last_sequence bigint NOT NULL DEFAULT -1,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (programme_id LIKE country || '\_%' ESCAPE '\\'),
  CHECK (facility_id IS NULL OR facility_id LIKE country || '\_%' ESCAPE '\\')
);

CREATE TABLE sync_operations (
  operation_id uuid PRIMARY KEY,
  device_id text NOT NULL REFERENCES sync_devices(device_id),
  actor_id text NOT NULL,
  country text NOT NULL CHECK (country IN ('KE', 'GH', 'ZA')),
  programme_id text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = 'household'),
  entity_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update')),
  sequence bigint NOT NULL CHECK (sequence >= 0),
  base_version integer NOT NULL CHECK (base_version >= 0),
  payload_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('accepted', 'applied', 'conflict', 'rejected')),
  result_version integer,
  rejection_code text,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  UNIQUE (device_id, sequence),
  CHECK (programme_id LIKE country || '\_%' ESCAPE '\\'),
  CHECK (entity_id LIKE country || '\_%' ESCAPE '\\')
);

CREATE INDEX sync_operations_scope_idx
  ON sync_operations (country, programme_id, device_id, received_at DESC);
