import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "invited_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "first_signed_in_at" timestamp(3) with time zone;
  ALTER TABLE "students" ADD COLUMN "portal_set_up" boolean DEFAULT false;
  ALTER TABLE "students" ADD COLUMN "setup_code_hash" varchar;
  ALTER TABLE "students" ADD COLUMN "setup_code_expires_at" timestamp(3) with time zone;
  ALTER TABLE "students" ADD COLUMN "setup_code_attempts" numeric;
  ALTER TABLE "students" ADD COLUMN "setup_code_sent_at" timestamp(3) with time zone;
  -- A student who was not due to change their password already has one of their own.
  UPDATE "students" SET "portal_set_up" = NOT COALESCE("must_change_password", true);
  ALTER TABLE "students" DROP COLUMN "must_change_password";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "students" ADD COLUMN "must_change_password" boolean DEFAULT true;
  ALTER TABLE "users" DROP COLUMN "invited_at";
  ALTER TABLE "users" DROP COLUMN "first_signed_in_at";
  ALTER TABLE "students" DROP COLUMN "portal_set_up";
  ALTER TABLE "students" DROP COLUMN "setup_code_hash";
  ALTER TABLE "students" DROP COLUMN "setup_code_expires_at";
  ALTER TABLE "students" DROP COLUMN "setup_code_attempts";
  ALTER TABLE "students" DROP COLUMN "setup_code_sent_at";`)
}
