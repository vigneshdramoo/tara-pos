-- CreateEnum
CREATE TYPE "public"."StaffRole" AS ENUM ('MANAGER', 'SALES_MANAGER');

-- CreateTable
CREATE TABLE "public"."StaffUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."StaffRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_username_key" ON "public"."StaffUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "public"."StaffUser"("email");
