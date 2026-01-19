-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "emailVerified" BOOLEAN DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "lastLoginAt" TIMESTAMP(3),
    "locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "agency" TEXT,
    "phone" TEXT,
    "color" TEXT,
    "logo" TEXT,
    "agency_phone" TEXT,
    "agency_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "price_type" TEXT NOT NULL DEFAULT 'night',
    "beds" INTEGER NOT NULL,
    "baths" INTEGER NOT NULL,
    "sqm" INTEGER NOT NULL,
    "amenities" TEXT[],
    "images" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "license_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "owner_agent_id" INTEGER NOT NULL,
    "booking_agent_id" INTEGER NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_email" TEXT NOT NULL,
    "client_phone" TEXT,
    "check_in" TIMESTAMP(3) NOT NULL,
    "check_out" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_otps" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "owner_agent_id" INTEGER NOT NULL,
    "booking_agent_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "owner_commission" DECIMAL(10,2) NOT NULL,
    "booking_commission" DECIMAL(10,2) NOT NULL,
    "platform_fee" DECIMAL(10,2) NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_properties" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "beds" INTEGER NOT NULL,
    "baths" INTEGER NOT NULL,
    "sqm" INTEGER NOT NULL,
    "amenities" TEXT[],
    "images" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "license_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_transactions" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "seller_agent_id" INTEGER NOT NULL,
    "buyer_agent_id" INTEGER NOT NULL,
    "buyer_name" TEXT NOT NULL,
    "buyer_email" TEXT NOT NULL,
    "buyer_phone" TEXT,
    "sale_price" DECIMAL(12,2) NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_commissions" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "seller_agent_id" INTEGER NOT NULL,
    "buyer_agent_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "seller_commission" DECIMAL(12,2) NOT NULL,
    "buyer_commission" DECIMAL(12,2) NOT NULL,
    "platform_fee" DECIMAL(12,2) NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 4.00,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_availability" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_available" INTEGER NOT NULL DEFAULT 1,
    "booking_id" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_amenities" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE INDEX "email_otps_email_type_idx" ON "email_otps"("email", "type");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_booking_id_key" ON "commissions"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_commissions_transaction_id_key" ON "sales_commissions"("transaction_id");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_owner_agent_id_fkey" FOREIGN KEY ("owner_agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booking_agent_id_fkey" FOREIGN KEY ("booking_agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_owner_agent_id_fkey" FOREIGN KEY ("owner_agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_booking_agent_id_fkey" FOREIGN KEY ("booking_agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_properties" ADD CONSTRAINT "sales_properties_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "sales_properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_seller_agent_id_fkey" FOREIGN KEY ("seller_agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_buyer_agent_id_fkey" FOREIGN KEY ("buyer_agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_seller_agent_id_fkey" FOREIGN KEY ("seller_agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_buyer_agent_id_fkey" FOREIGN KEY ("buyer_agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_availability" ADD CONSTRAINT "property_availability_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_availability" ADD CONSTRAINT "property_availability_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_amenities" ADD CONSTRAINT "agent_amenities_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
