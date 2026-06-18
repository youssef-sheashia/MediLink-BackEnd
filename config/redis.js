import { createClient } from "redis";

const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));

try {
  await client.connect();
} catch (err) {
  console.warn(
    "Redis unavailable; continuing without cache/OTP storage:",
    err.message,
  );
}

export default client;
