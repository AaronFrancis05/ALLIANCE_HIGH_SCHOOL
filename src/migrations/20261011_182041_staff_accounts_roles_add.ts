import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Staff accounts move from one role to an account type plus any number of roles (FR-05).
 * Generated in two halves so neither needed an interactive prompt: this one adds the new
 * columns and copies every account's access across; staff_accounts_roles_drop then drops
 * the old column. Copying maps the merged roles: registrar to secretary, admissions to
 * bursar, and superAdmin to the super admin account type with no roles.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('editor', 'secretary', 'bursar', 'hod', 'teacher');
  CREATE TYPE "public"."enum_users_account_type" AS ENUM('staff', 'superAdmin');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
  ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;
  ALTER TABLE "users" ADD COLUMN "account_type" "enum_users_account_type" DEFAULT 'staff' NOT NULL;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");`)

  await db.execute(sql`
  UPDATE "users" SET "account_type" = 'superAdmin' WHERE "role" = 'superAdmin';
  INSERT INTO "users_roles" ("order", "parent_id", "value")
    SELECT 1, "id", (CASE "role"::text
        WHEN 'registrar' THEN 'secretary'
        WHEN 'admissions' THEN 'bursar'
        ELSE "role"::text
      END)::"enum_users_roles"
    FROM "users"
    WHERE "role" IS NOT NULL AND "role" <> 'superAdmin';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Back to one role each: the super admin, otherwise the first role (merged roles map back
  // to the role they came from), otherwise teacher, the old default.
  await db.execute(sql`
  UPDATE "users" u SET "role" = (CASE
      WHEN u."account_type" = 'superAdmin' THEN 'superAdmin'
      ELSE COALESCE(
        (SELECT (CASE r."value"::text WHEN 'secretary' THEN 'registrar' ELSE r."value"::text END)
           FROM "users_roles" r WHERE r."parent_id" = u."id" ORDER BY r."order" LIMIT 1),
        'teacher')
    END)::"enum_users_role";`)

  await db.execute(sql`
   ALTER TABLE "users_roles" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_roles" CASCADE;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'teacher';
  ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
  ALTER TABLE "users" DROP COLUMN "account_type";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_account_type";`)
}
