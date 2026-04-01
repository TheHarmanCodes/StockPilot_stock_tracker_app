import mongoose from "mongoose";
import "dotenv/config";
import { connectToDatabase } from "@/database/mongoose";

const testDB = async () => {
  try {
    console.log("Connecting to database...");

    await connectToDatabase();

    console.log("Database connected successfully!");

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database not initialized");
    }

    await db.admin().ping();
    console.log("Ping successful!");

    const collections = await db.listCollections().toArray();

    console.log("Collections:");
    collections.forEach((col) => console.log(`- ${col.name}`));

    process.exit(0);
  } catch (error) {
    console.error("DB Test Failed:", error);
    process.exit(1);
  }
};

testDB();
