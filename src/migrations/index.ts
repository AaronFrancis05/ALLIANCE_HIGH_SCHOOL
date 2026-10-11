import * as migration_20260930_141313 from './20260930_141313';
import * as migration_20261010_095523_invites_first_signin from './20261010_095523_invites_first_signin';
import * as migration_20261011_174938_holiday_work from './20261011_174938_holiday_work';
import * as migration_20261011_182041_staff_accounts_roles_add from './20261011_182041_staff_accounts_roles_add';
import * as migration_20261011_182129_staff_accounts_roles_drop from './20261011_182129_staff_accounts_roles_drop';

export const migrations = [
  {
    up: migration_20260930_141313.up,
    down: migration_20260930_141313.down,
    name: '20260930_141313',
  },
  {
    up: migration_20261010_095523_invites_first_signin.up,
    down: migration_20261010_095523_invites_first_signin.down,
    name: '20261010_095523_invites_first_signin',
  },
  {
    up: migration_20261011_174938_holiday_work.up,
    down: migration_20261011_174938_holiday_work.down,
    name: '20261011_174938_holiday_work',
  },
  {
    up: migration_20261011_182041_staff_accounts_roles_add.up,
    down: migration_20261011_182041_staff_accounts_roles_add.down,
    name: '20261011_182041_staff_accounts_roles_add',
  },
  {
    up: migration_20261011_182129_staff_accounts_roles_drop.up,
    down: migration_20261011_182129_staff_accounts_roles_drop.down,
    name: '20261011_182129_staff_accounts_roles_drop'
  },
];
