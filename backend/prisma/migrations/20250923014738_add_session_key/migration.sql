-- CreateEnum
CREATE TYPE "SoilType" AS ENUM ('MEDIO', 'ARGILOSO', 'ARENOSO');

-- CreateEnum
CREATE TYPE "HarvestPhase" AS ENUM ('INICIAL', 'DESENVOLVIMENTO', 'MATURACAO');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMAR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "farmName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "soilType" "SoilType",
    "harvestPhase" "HarvestPhase",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "irrigations" (
    "id" TEXT NOT NULL,
    "irrigatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "irrigations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "irrigations" ADD CONSTRAINT "irrigations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
