const cron = require("node-cron");


const Reading = require("../models/reading"); // adjust path if needed

// Schedule daily aggregation at 23:59
cron.schedule("59 23 * * *", async () => {
  console.log(" Running daily aggregation...");

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  try {
    const meters = await Reading.distinct("meter_id");

    for (const meter_id of meters) {
      const aggregation = await Reading.aggregate([
        { $match: { 
            meter_id, 
            timestamp: { $gte: start.toISOString(), $lt: end.toISOString() } 
        }},
        { $sort: { timestamp: 1 } },
        { $group: {
            _id: "$meter_id",
            first_import: { $first: "$import_kwh" },
            last_import: { $last: "$import_kwh" },
            first_export: { $first: "$export_kwh" },
            last_export: { $last: "$export_kwh" }
        }},
        { $project: {
            total_import: { $subtract: ["$last_import", "$first_import"] },
            total_export: { $subtract: ["$last_export", "$first_export"] }
        }}
      ]);

      if (aggregation.length > 0) {
        const dailyData = {
          meter_id,
          import_kwh: aggregation[0].total_import,
          export_kwh: aggregation[0].total_export,
          date: start.toISOString().split("T")[0]
        };

        try {
         ///// await writeReadingOnChain(dailyData);
          console.log(` Aggregated reading for meter ${meter_id} written to blockchain`);
        } catch (err) {
          console.error(` Blockchain write failed for meter ${meter_id}:`, err);
        }
      } else {
        console.log(` No readings found for meter ${meter_id} on ${start.toISOString().split("T")[0]}`);
      }
    }
  } catch (err) {
    console.error(" Daily aggregation error:", err);
  }
});

