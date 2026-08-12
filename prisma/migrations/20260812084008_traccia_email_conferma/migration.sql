-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "confirmationEmailError" TEXT,
ADD COLUMN     "confirmationEmailSentAt" TIMESTAMP(3);
