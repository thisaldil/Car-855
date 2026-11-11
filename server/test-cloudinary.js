
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinary() {
  try {
    const result = await cloudinary.api.ping();

    console.log("================================");
    console.log("Cloudinary Connection Successful!");
    console.log(result);
    console.log("================================");
  } catch (error) {
    console.error("Cloudinary Connection Failed!");
    console.error(error.message);
  }
}

testCloudinary();
