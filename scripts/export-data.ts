import "dotenv/config";
import { db } from "../server/db";
import { 
  agents, 
  properties, 
  bookings, 
  commissions,
  salesProperties,
  salesTransactions,
  salesCommissions,
  propertyAvailability,
  agentAmenities
} from "@shared/schema";
import fs from "fs";
import path from "path";

async function exportData() {
  console.log("🔄 Starting data export from current database...\n");

  try {
    // Create export directory
    const exportDir = path.join(process.cwd(), "data-export");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Export agents
    console.log("📊 Exporting agents...");
    const agentsData = await db.select().from(agents);
    fs.writeFileSync(
      path.join(exportDir, "agents.json"),
      JSON.stringify(agentsData, null, 2)
    );
    console.log(`✅ Exported ${agentsData.length} agents`);

    // Export properties
    console.log("📊 Exporting properties...");
    const propertiesData = await db.select().from(properties);
    fs.writeFileSync(
      path.join(exportDir, "properties.json"),
      JSON.stringify(propertiesData, null, 2)
    );
    console.log(`✅ Exported ${propertiesData.length} properties`);

    // Export bookings
    console.log("📊 Exporting bookings...");
    const bookingsData = await db.select().from(bookings);
    fs.writeFileSync(
      path.join(exportDir, "bookings.json"),
      JSON.stringify(bookingsData, null, 2)
    );
    console.log(`✅ Exported ${bookingsData.length} bookings`);

    // Export commissions
    console.log("📊 Exporting commissions...");
    const commissionsData = await db.select().from(commissions);
    fs.writeFileSync(
      path.join(exportDir, "commissions.json"),
      JSON.stringify(commissionsData, null, 2)
    );
    console.log(`✅ Exported ${commissionsData.length} commissions`);

    // Export sales properties
    console.log("📊 Exporting sales properties...");
    const salesPropertiesData = await db.select().from(salesProperties);
    fs.writeFileSync(
      path.join(exportDir, "sales-properties.json"),
      JSON.stringify(salesPropertiesData, null, 2)
    );
    console.log(`✅ Exported ${salesPropertiesData.length} sales properties`);

    // Export sales transactions
    console.log("📊 Exporting sales transactions...");
    const salesTransactionsData = await db.select().from(salesTransactions);
    fs.writeFileSync(
      path.join(exportDir, "sales-transactions.json"),
      JSON.stringify(salesTransactionsData, null, 2)
    );
    console.log(`✅ Exported ${salesTransactionsData.length} sales transactions`);

    // Export sales commissions
    console.log("📊 Exporting sales commissions...");
    const salesCommissionsData = await db.select().from(salesCommissions);
    fs.writeFileSync(
      path.join(exportDir, "sales-commissions.json"),
      JSON.stringify(salesCommissionsData, null, 2)
    );
    console.log(`✅ Exported ${salesCommissionsData.length} sales commissions`);

    // Export property availability
    console.log("📊 Exporting property availability...");
    const propertyAvailabilityData = await db.select().from(propertyAvailability);
    fs.writeFileSync(
      path.join(exportDir, "property-availability.json"),
      JSON.stringify(propertyAvailabilityData, null, 2)
    );
    console.log(`✅ Exported ${propertyAvailabilityData.length} property availability records`);

    // Export agent amenities
    console.log("📊 Exporting agent amenities...");
    const agentAmenitiesData = await db.select().from(agentAmenities);
    fs.writeFileSync(
      path.join(exportDir, "agent-amenities.json"),
      JSON.stringify(agentAmenitiesData, null, 2)
    );
    console.log(`✅ Exported ${agentAmenitiesData.length} agent amenities`);

    // Create summary
    const summary = {
      exportDate: new Date().toISOString(),
      tables: {
        agents: agentsData.length,
        properties: propertiesData.length,
        bookings: bookingsData.length,
        commissions: commissionsData.length,
        salesProperties: salesPropertiesData.length,
        salesTransactions: salesTransactionsData.length,
        salesCommissions: salesCommissionsData.length,
        propertyAvailability: propertyAvailabilityData.length,
        agentAmenities: agentAmenitiesData.length,
      },
      totalRecords: agentsData.length + propertiesData.length + bookingsData.length + 
                    commissionsData.length + salesPropertiesData.length + 
                    salesTransactionsData.length + salesCommissionsData.length +
                    propertyAvailabilityData.length + agentAmenitiesData.length,
    };

    fs.writeFileSync(
      path.join(exportDir, "export-summary.json"),
      JSON.stringify(summary, null, 2)
    );

    console.log("\n✨ Data export completed successfully!");
    console.log(`📁 Export location: ${exportDir}`);
    console.log(`📊 Total records exported: ${summary.totalRecords}`);
    console.log("\nSummary:");
    console.log(JSON.stringify(summary.tables, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error exporting data:", error);
    process.exit(1);
  }
}

exportData();
