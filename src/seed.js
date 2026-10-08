import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Farmhouse from './models/Farmhouse.js';
import Notification from './models/Notification.js';

const image1 = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=85';
const image2 = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=85';
const image3 = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85';
const image4 = 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85';

await connectDB();
await User.deleteMany({});
await Farmhouse.deleteMany({});
await Notification.deleteMany({});

const password = await bcrypt.hash('123456', 12);
const owner = await User.create({
  name: 'FarmHouse Owner',
  email: 'owner@farmhouserent.com',
  password,
  phone: '9876543210',
  role: 'owner'
});

await User.create({
  name: 'Demo User',
  email: 'user@farmhouserent.com',
  password,
  phone: '9876501234',
  role: 'user'
});

await User.create({
  name: 'Admin',
  email: 'admin@farmhouserent.com',
  password,
  role: 'admin'
});

await Farmhouse.insertMany([
  {
    title: 'Green Valley Farm House',
    description: 'A peaceful luxury farmhouse surrounded by greenery, ideal for families and weekend stays.',
    location: 'Lonavala, Maharashtra', city: 'Lonavala', pricePerNight: 5000, guests: 8, bedrooms: 4, bathrooms: 3,
    amenities: ['Swimming Pool', 'WiFi', 'AC Rooms', 'Parking', 'Bonfire', 'Kitchen'],
    images: [image1, image2, image3], rating: 4.8, reviewCount: 24, owner: owner._id, status: 'approved'
  },
  {
    title: 'Sunset Paradise Farm House',
    description: 'Beautiful sunset views, private lawn and modern interiors for memorable group stays.',
    location: 'Alibaug, Maharashtra', city: 'Alibaug', pricePerNight: 7500, guests: 10, bedrooms: 5, bathrooms: 4,
    amenities: ['Swimming Pool', 'WiFi', 'Garden', 'Parking', 'BBQ', 'Pet Friendly'],
    images: [image2, image4, image1], rating: 4.7, reviewCount: 18, owner: owner._id, status: 'approved'
  },
  {
    title: "Nature's Nest Farm House",
    description: 'A cozy nature retreat with a large garden, comfortable bedrooms and outdoor seating.',
    location: 'Karjat, Maharashtra', city: 'Karjat', pricePerNight: 4500, guests: 6, bedrooms: 3, bathrooms: 2,
    amenities: ['Garden', 'WiFi', 'Parking', 'Kitchen', 'Bonfire'],
    images: [image3, image1, image4], rating: 4.6, reviewCount: 12, owner: owner._id, status: 'approved'
  },
  {
    title: 'Royal Farm House',
    description: 'Premium villa-style farmhouse with spacious rooms and a private pool for celebrations.',
    location: 'Panchgani, Maharashtra', city: 'Panchgani', pricePerNight: 6500, guests: 12, bedrooms: 6, bathrooms: 5,
    amenities: ['Private Pool', 'WiFi', 'AC Rooms', 'Parking', 'Kitchen', 'Bonfire'],
    images: [image4, image2, image3], rating: 4.9, reviewCount: 31, owner: owner._id, status: 'approved'
  }
]);

console.log('Seed completed.');
process.exit(0);
