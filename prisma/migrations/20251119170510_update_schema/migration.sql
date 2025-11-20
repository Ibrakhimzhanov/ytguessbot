-- AlterTable
ALTER TABLE "users" ADD COLUMN     "language" VARCHAR(2) NOT NULL DEFAULT 'uz',
ADD COLUMN     "lotery_id" INTEGER,
ALTER COLUMN "phone_number" DROP NOT NULL,
ALTER COLUMN "full_name" DROP NOT NULL;
