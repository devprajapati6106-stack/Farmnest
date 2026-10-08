import 'dotenv/config';
import { connectDB } from './config/db.js';
import Farmhouse from './models/Farmhouse.js';

await connectDB();

const result = await Farmhouse.updateMany(
  { pricePerNight: { $lte: 0 } },
  { $set: { pricePerNight: 5000 } }
);

const weekendResult = await Farmhouse.updateMany(
  { pricePerNight: { $gt: 0 }, weekendPrice: { $lte: 0 } },
  [{ $set: { weekendPrice: '$pricePerNight' } }]
);

console.log(`Price repair complete. Weekday prices updated: ${result.modifiedCount}. Weekend prices filled: ${weekendResult.modifiedCount}.`);
process.exit(0);
