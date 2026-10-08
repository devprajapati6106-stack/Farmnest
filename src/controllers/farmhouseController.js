import Farmhouse from '../models/Farmhouse.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import ChatMessage from '../models/ChatMessage.js';
import { notify } from '../utils/notify.js';

export async function listFarmhouses(req, res) {
  try {
    const { search = '', city = '', minPrice, maxPrice, guests, sort = 'newest' } = req.query;
    const filter = { status: 'approved', isActive: { $ne: false } };
    if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { location: { $regex: search, $options: 'i' } }, { city: { $regex: search, $options: 'i' } }];
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }
    if (guests) filter.guests = { $gte: Number(guests) };
    const sortMap = { newest: { createdAt: -1 }, priceLow: { pricePerNight: 1 }, priceHigh: { pricePerNight: -1 }, rating: { rating: -1 } };
    const farmhouses = await Farmhouse.find(filter).populate('owner', 'name').sort(sortMap[sort] || sortMap.newest);
    res.json({ farmhouses });
  } catch (error) { res.status(500).json({ message: 'Unable to load farmhouses.', error: error.message }); }
}

export async function getFarmhouse(req, res) {
  try {
    const farmhouse = await Farmhouse.findOne({ _id: req.params.id, status: 'approved', isActive: { $ne: false } }).populate('owner', 'name email phone');
    if (!farmhouse) return res.status(404).json({ message: 'Farmhouse not found.' });
    res.json({ farmhouse });
  } catch { res.status(400).json({ message: 'Invalid farmhouse id.' }); }
}

export async function createFarmhouse(req, res) {
  try {
    const payload = { ...req.body, owner: req.user._id, status: 'pending', isActive: true, pricePerNight: Number(req.body.pricePerNight) };
    if (!Number.isFinite(payload.pricePerNight) || payload.pricePerNight <= 0) return res.status(400).json({ message: 'Weekday price must be greater than ₹0.' });
    const farmhouse = await Farmhouse.create(payload);
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');
    await Promise.all(admins.map(admin => notify(admin._id, 'New farmhouse approval', `${farmhouse.title} is waiting for admin review.`, 'farmhouse')));
    res.status(201).json({ message: 'Farmhouse submitted for admin approval.', farmhouse });
  } catch (error) { res.status(400).json({ message: 'Could not create farmhouse.', error: error.message }); }
}

export async function updateFarmhouse(req, res) {
  try {
    if (Number(req.body.pricePerNight) <= 0 || !Number.isFinite(Number(req.body.pricePerNight))) return res.status(400).json({ message: 'Weekday price must be greater than ₹0.' });
    const farmhouse = await Farmhouse.findOneAndUpdate({ _id: req.params.id, owner: req.user._id, status: { $ne: 'inactive' } }, { ...req.body, status: 'pending', adminNote: '' }, { new: true, runValidators: true });
    if (!farmhouse) return res.status(404).json({ message: 'Farmhouse not found or not owned by you.' });
    res.json({ message: 'Changes submitted for admin approval.', farmhouse });
  } catch (error) { res.status(400).json({ message: 'Could not update farmhouse.', error: error.message }); }
}

export async function deleteFarmhouse(req, res) {
  try {
    const farmhouse = await Farmhouse.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!farmhouse) {
      return res.status(404).json({
        message: 'Farmhouse not found or not owned by you.'
      });
    }

    // Remove data that is strictly tied to the deleted property.
    await Promise.all([
      Review.deleteMany({ farmhouse: farmhouse._id }),
      ChatMessage.deleteMany({ farmhouse: farmhouse._id })
    ]);

    // Permanently remove the farmhouse document from MongoDB.
    await farmhouse.deleteOne();

    res.json({
      message: 'Farmhouse deleted permanently from the database.'
    });
  } catch (error) {
    console.error('deleteFarmhouse:', error);
    res.status(500).json({
      message: 'Could not delete farmhouse.',
      error: error.message
    });
  }
}

export async function toggleFarmhouseStatus(req, res) {
  try {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be active or inactive.'
      });
    }

    const farmhouse = await Farmhouse.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!farmhouse) {
      return res.status(404).json({
        message: 'Farmhouse not found or not owned by you.'
      });
    }

    // Only admin-approved/recently inactive properties can be activated.
    if (status === 'active') {
      if (!['approved', 'inactive'].includes(farmhouse.status)) {
        return res.status(400).json({
          message: 'Only an approved farmhouse can be activated.'
        });
      }
      farmhouse.status = 'approved';
      farmhouse.isActive = true;
    } else {
      if (farmhouse.status === 'pending') {
        return res.status(400).json({
          message: 'A pending farmhouse cannot be made inactive.'
        });
      }
      farmhouse.status = 'inactive';
      farmhouse.isActive = false;
    }

    await farmhouse.save();

    res.json({
      message: `Farmhouse ${status === 'active' ? 'activated' : 'deactivated'} successfully.`,
      farmhouse
    });
  } catch (error) {
    console.error('toggleFarmhouseStatus:', error);
    res.status(500).json({
      message: 'Could not update farmhouse status.',
      error: error.message
    });
  }
}


export async function availability(req, res) {
  try {
    const farmhouse = await Farmhouse.findOne({ _id: req.params.id, status: 'approved', isActive: { $ne: false } }).select('blockedDates');
    if (!farmhouse) return res.status(404).json({ message: 'Farmhouse not found.' });
    const bookings = await Booking.find({ farmhouse: req.params.id, status: { $in: ['pending', 'confirmed'] } }).select('checkIn checkOut');
    res.json({ blockedDates: farmhouse.blockedDates || [], bookings });
  } catch (error) {
    res.status(400).json({ message: 'Unable to load availability.' });
  }
}


export async function updateAvailability(req, res) {
  try {
    const { blockedDates = [] } = req.body;
    const farmhouse = await Farmhouse.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, status: { $ne: 'inactive' } },
      { blockedDates: blockedDates.map(date => new Date(date)) },
      { new: true, runValidators: true }
    );
    if (!farmhouse) return res.status(404).json({ message: 'Farmhouse not found.' });
    res.json({ message: 'Availability calendar updated.', farmhouse });
  } catch (error) {
    res.status(400).json({ message: 'Could not update availability.', error: error.message });
  }
}

export async function ownerFarmhouses(req, res) {
  const farmhouses = await Farmhouse.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ farmhouses });
}
