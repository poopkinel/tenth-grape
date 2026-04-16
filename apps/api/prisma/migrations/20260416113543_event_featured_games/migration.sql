-- AlterTable
ALTER TABLE "events" ADD COLUMN     "externalLink" TEXT,
ADD COLUMN     "featuredBggIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
