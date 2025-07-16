-- CreateTable
CREATE TABLE "alerts" (
    "alert_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID,
    "risk_score" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(20) DEFAULT 'open',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("alert_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "log_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alert_id" UUID,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "devices" (
    "device_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "fingerprint" VARCHAR(255) NOT NULL,
    "last_seen" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "merchant_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50),
    "risk_level" INTEGER DEFAULT 50,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("merchant_id")
);

-- CreateTable
CREATE TABLE "risk_signals" (
    "signal_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID,
    "signal_type" VARCHAR(50) NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_signals_pkey" PRIMARY KEY ("signal_id")
);

-- CreateTable
CREATE TABLE "training_data" (
    "data_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID,
    "features_json" JSONB NOT NULL,
    "label" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_data_pkey" PRIMARY KEY ("data_id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "transaction_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "device_id" UUID,
    "merchant_id" UUID,
    "amount" DECIMAL(15,2) NOT NULL,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) DEFAULT 'pending',

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "idx_alerts_created_at" ON "alerts"("created_at");

-- CreateIndex
CREATE INDEX "idx_training_data_created_at" ON "training_data"("created_at");

-- CreateIndex
CREATE INDEX "idx_transactions_timestamp" ON "transactions"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("alert_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "risk_signals" ADD CONSTRAINT "risk_signals_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_data" ADD CONSTRAINT "training_data_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("merchant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

