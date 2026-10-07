require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const seedData = [
  {
    name: "Test User",
    email: "test@example.com",
    password: "123456"
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    await User.insertMany(seedData);

    console.log("Database seeded successfully!");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

seedDatabase();