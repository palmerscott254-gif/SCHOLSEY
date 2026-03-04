-- AlterTable
ALTER TABLE "remote_actions" ALTER COLUMN "expires_at" SET DEFAULT (NOW() + INTERVAL '5 minutes');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_picture" VARCHAR(500);
