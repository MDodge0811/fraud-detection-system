/*
  Warnings:

  - You are about to drop the column `features_json` on the `training_data` table. All the data in the column will be lost.
  - Added the required column `features` to the `training_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "training_data" DROP COLUMN "features_json",
ADD COLUMN     "features" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "ml_models" (
    "model_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "model_type" VARCHAR(50) NOT NULL,
    "model_data" JSONB NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_models_pkey" PRIMARY KEY ("model_id")
);

-- CreateIndex
CREATE INDEX "idx_ml_models_type_created" ON "ml_models"("model_type", "created_at");
