import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prismaUrl = process.env.DATABASE_URL || "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19YN3hRLWg3NGRjOHFFUkhkQUhCTWEiLCJhcGlfa2V5IjoiMDFLRjBYUTdCMDJFOUdUNzhZTkM0QllSR1oiLCJ0ZW5hbnRfaWQiOiJhY2M4OTEwMTcxNzhiNDNmNjc3NTkyZjdhNWNjYTYyODFhOTI3NzZlMDdhN2M3ZGU3OWFlNWNkNmFiZWJhYzY2IiwiaW50ZXJuYWxfc2VjcmV0IjoiZTI2Mzk3MTItNmMwZS00ZjY5LWFhYmUtYmY3MGRhZjU1OTM1In0.rIrwB10hfO-Mt5PTMScZnsGNdwRF4rThlr6RK9xEZ9E";

const prisma = new PrismaClient({
  accelerateUrl: prismaUrl,
});

async function importData() {
  console.log("🔄 Starting data import to new Prisma database...\n");

  try {
    const exportDir = path.join(process.cwd(), "data-export");

    // Import in order of foreign key dependencies

    // 1. Agents (no dependencies)
    console.log("📊 Importing agents...");
    const agentsData = JSON.parse(
      fs.readFileSync(path.join(exportDir, "agents.json"), "utf-8")
    );
    for (const agent of agentsData) {
      await prisma.agent.create({
        data: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          agency: agent.agency,
          phone: agent.phone,
          agencyPhone: agent.agencyPhone,
          agencyEmail: agent.agencyEmail,
          createdAt: new Date(agent.createdAt),
        },
      });
    }
    console.log(`✅ Imported ${agentsData.length} agents`);

    // 2. Properties (depends on agents)
    console.log("📊 Importing properties...");
    const propertiesData = JSON.parse(
      fs.readFileSync(path.join(exportDir, "properties.json"), "utf-8")
    );
    for (const property of propertiesData) {
      await prisma.property.create({
        data: {
          id: property.id,
          agentId: property.agentId,
          title: property.title,
          description: property.description,
          location: property.location,
          propertyType: property.propertyType,
          price: property.price,
          priceType: property.priceType,
          beds: property.beds,
          baths: property.baths,
          sqm: property.sqm,
          amenities: property.amenities,
          images: property.images,
          status: property.status,
          licenseNumber: property.licenseNumber,
          createdAt: new Date(property.createdAt),
          updatedAt: new Date(property.updatedAt),
        },
      });
    }
    console.log(`✅ Imported ${propertiesData.length} properties`);

    // 3. Sales Properties (depends on agents)
    console.log("📊 Importing sales properties...");
    const salesPropertiesData = JSON.parse(
      fs.readFileSync(path.join(exportDir, "sales-properties.json"), "utf-8")
    );
    for (const property of salesPropertiesData) {
      await prisma.salesProperty.create({
        data: {
          id: property.id,
          agentId: property.agentId,
          title: property.title,
          description: property.description,
          location: property.location,
          propertyType: property.propertyType,
          price: property.price,
          beds: property.beds,
          baths: property.baths,
          sqm: property.sqm,
          amenities: property.amenities,
          images: property.images,
          status: property.status,
          licenseNumber: property.licenseNumber,
          createdAt: new Date(property.createdAt),
          updatedAt: new Date(property.updatedAt),
        },
      });
    }
    console.log(`✅ Imported ${salesPropertiesData.length} sales properties`);

    // 4. Bookings (depends on properties and agents)
    console.log("📊 Importing bookings...");
    const bookingsData = JSON.parse(
      fs.readFileSync(path.join(exportDir, "bookings.json"), "utf-8")
    );
    for (const booking of bookingsData) {
      await prisma.booking.create({
        data: {
          id: booking.id,
          propertyId: booking.propertyId,
          ownerAgentId: booking.ownerAgentId,
          bookingAgentId: booking.bookingAgentId,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          clientPhone: booking.clientPhone,
          checkIn: new Date(booking.checkIn),
          checkOut: new Date(booking.checkOut),
          totalAmount: booking.totalAmount,
          status: booking.status,
          createdAt: new Date(booking.createdAt),
        },
      });
    }
    console.log(`✅ Imported ${bookingsData.length} bookings`);

    // 5. Commissions (depends on bookings and agents)
    console.log("📊 Importing commissions...");
    const commissionsData = JSON.parse(
      fs.readFileSync(path.join(exportDir, "commissions.json"), "utf-8")
    );
    for (const commission of commissionsData) {
      await prisma.commission.create({
        data: {
          id: commission.id,
          bookingId: commission.bookingId,
          ownerAgentId: commission.ownerAgentId,
          bookingAgentId: commission.bookingAgentId,
          totalAmount: commission.totalAmount,
          ownerCommission: commission.ownerCommission,
          bookingCommission: commission.bookingCommission,
          platformFee: commission.platformFee,
          commissionRate: commission.commissionRate,
          status: commission.status,
          createdAt: new Date(commission.createdAt),
        },
      });
    }
    console.log(`✅ Imported ${commissionsData.length} commissions`);

    // 6. Sales Transactions (depends on sales properties and agents)
    console.log("📊 Importing sales transactions...");
    const salesTransactionsData = JSON.parse(
      fs.readFileSync(path.join(exportDir, "sales-transactions.json"), "utf-8")
    );
    for (const transaction of salesTransactionsData) {
      await prisma.salesTransaction.create({
        data: {
          id: transaction.id,
          propertyId: transaction.propertyId,
          sellerAgentId: transaction.sellerAgentId,
          buyerAgentId: transaction.buyerAgentId,
          buyerName: transaction.buyerName,
          buyerEmail: transaction.buyerEmail,
          buyerPhone: transaction.buyerPhone,
          salePrice: transaction.salePrice,
          saleDate: new Date(transaction.saleDate),
          status: transaction.status,
          createdAt: new Date(transaction.createdAt),
        },
      });
    }
    console.log(`✅ Imported ${salesTransactionsData.length} sales transactions`);

    // 7. Sales Commissions (depends on sales transactions and agents)
    console.log("📊 Importing sales commissions...");
    const salesCommissionsData = JSON.parse(
      fs.readFileSync(path.join(exportDir, "sales-commissions.json"), "utf-8")
    );
    for (const commission of salesCommissionsData) {
      await prisma.salesCommission.create({
        data: {
          id: commission.id,
          transactionId: commission.transactionId,
          sellerAgentId: commission.sellerAgentId,
          buyerAgentId: commission.buyerAgentId,
          totalAmount: commission.totalAmount,
          sellerCommission: commission.sellerCommission,
          buyerCommission: commission.buyerCommission,
          platformFee: commission.platformFee,
          commissionRate: commission.commissionRate,
          status: commission.status,
          createdAt: new Date(commission.createdAt),
        },
      });
    }
    console.log(`✅ Imported ${salesCommissionsData.length} sales commissions`);

    // 8. Property Availability (depends on properties and bookings)
    console.log("📊 Importing property availability...");
    const propertyAvailabilityData = JSON.parse(
      fs.readFileSync(path.join(exportDir, "property-availability.json"), "utf-8")
    );
    for (const availability of propertyAvailabilityData) {
      await prisma.propertyAvailability.create({
        data: {
          id: availability.id,
          propertyId: availability.propertyId,
          startDate: new Date(availability.startDate),
          endDate: new Date(availability.endDate),
          isAvailable: availability.isAvailable,
          bookingId: availability.bookingId,
          notes: availability.notes,
          createdAt: new Date(availability.createdAt),
        },
      });
    }
    console.log(`✅ Imported ${propertyAvailabilityData.length} property availability records`);

    // 9. Agent Amenities (depends on agents)
    console.log("📊 Importing agent amenities...");
    const agentAmenitiesData = JSON.parse(
      fs.readFileSync(path.join(exportDir, "agent-amenities.json"), "utf-8")
    );
    for (const amenity of agentAmenitiesData) {
      await prisma.agentAmenity.create({
        data: {
          id: amenity.id,
          agentId: amenity.agentId,
          name: amenity.name,
          createdAt: new Date(amenity.createdAt),
        },
      });
    }
    console.log(`✅ Imported ${agentAmenitiesData.length} agent amenities`);

    // Create summary
    const totalRecords =
      agentsData.length +
      propertiesData.length +
      bookingsData.length +
      commissionsData.length +
      salesPropertiesData.length +
      salesTransactionsData.length +
      salesCommissionsData.length +
      propertyAvailabilityData.length +
      agentAmenitiesData.length;

    console.log("\n✨ Data import completed successfully!");
    console.log(`📊 Total records imported: ${totalRecords}`);

    // Verify counts
    console.log("\n🔍 Verifying data integrity...");
    const counts = {
      agents: await prisma.agent.count(),
      properties: await prisma.property.count(),
      bookings: await prisma.booking.count(),
      commissions: await prisma.commission.count(),
      salesProperties: await prisma.salesProperty.count(),
      salesTransactions: await prisma.salesTransaction.count(),
      salesCommissions: await prisma.salesCommission.count(),
      propertyAvailability: await prisma.propertyAvailability.count(),
      agentAmenities: await prisma.agentAmenity.count(),
    };

    console.log("Database record counts:");
    console.log(JSON.stringify(counts, null, 2));

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error importing data:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

importData();
