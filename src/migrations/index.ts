import * as migration_20260930_141313 from './20260930_141313';
import * as migration_20261010_095523_invites_first_signin from './20261010_095523_invites_first_signin';

export const migrations = [
  {
    up: migration_20260930_141313.up,
    down: migration_20260930_141313.down,
    name: '20260930_141313',
  },
  {
    up: migration_20261010_095523_invites_first_signin.up,
    down: migration_20261010_095523_invites_first_signin.down,
    name: '20261010_095523_invites_first_signin'
  },
];
