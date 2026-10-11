import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_resources_type" ADD VALUE 'holidayWork' BEFORE 'video';
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"subjects_id" integer
  );
  
  ALTER TABLE "resources" ALTER COLUMN "type" DROP DEFAULT;
  ALTER TABLE "subjects" ADD COLUMN "accepts_archives" boolean DEFAULT false;
  -- ICT practicals are handed out as ZIP folders (the subject code the seed uses).
  UPDATE "subjects" SET "accepts_archives" = true WHERE "code" = 'ICT';
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_subjects_fk" FOREIGN KEY ("subjects_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_subjects_id_idx" ON "users_rels" USING btree ("subjects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_rels" CASCADE;
  ALTER TABLE "resources" ALTER COLUMN "type" SET DATA TYPE text;
  -- The old type has no holiday work, so keep those rows as "other" rather than fail.
  UPDATE "resources" SET "type" = 'other' WHERE "type" = 'holidayWork';
  ALTER TABLE "resources" ALTER COLUMN "type" SET DEFAULT 'notes'::text;
  DROP TYPE "public"."enum_resources_type";
  CREATE TYPE "public"."enum_resources_type" AS ENUM('notes', 'pastPaper', 'textbook', 'scheme', 'video', 'other');
  ALTER TABLE "resources" ALTER COLUMN "type" SET DEFAULT 'notes'::"public"."enum_resources_type";
  ALTER TABLE "resources" ALTER COLUMN "type" SET DATA TYPE "public"."enum_resources_type" USING "type"::"public"."enum_resources_type";
  ALTER TABLE "subjects" DROP COLUMN "accepts_archives";`)
}
