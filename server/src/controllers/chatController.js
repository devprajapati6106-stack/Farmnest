import ChatMessage from '../models/ChatMessage.js';
import Farmhouse from '../models/Farmhouse.js';
import User from '../models/User.js';
import { notify } from '../utils/notify.js';

async function getCounterpartForOwner(farmhouseId, ownerId, requestedUserId) {
  if (requestedUserId) {
    const receiver = await User.findById(requestedUserId).select('_id role status');
    if (!receiver || receiver.role !== 'user' || receiver.status === 'suspended') return null;
    return receiver._id;
  }

  // If an owner opens a conversation without a selected customer, reply to
  // the most recent customer who contacted this farmhouse.
  const latestCustomerMessage = await ChatMessage.findOne({
    farmhouse: farmhouseId,
    sender: { $ne: ownerId },
  }).sort({ createdAt: -1 }).select('sender');

  return latestCustomerMessage?.sender || null;
}

export async function getConversation(req, res) {
  try {
    const farmhouse = await Farmhouse.findById(req.params.farmhouseId).select('owner title');
    if (!farmhouse) return res.status(404).json({ message: 'Farmhouse not found.' });

    const isOwner = String(farmhouse.owner) === String(req.user._id);
    if (!isOwner && req.user.role !== 'user') {
      return res.status(403).json({ message: 'Not allowed.' });
    }

    const counterpart = isOwner
      ? await getCounterpartForOwner(farmhouse._id, req.user._id, req.query.userId)
      : farmhouse.owner;

    if (!counterpart) {
      return res.json({ messages: [], owner: farmhouse.owner, title: farmhouse.title });
    }

    const messages = await ChatMessage.find({
      farmhouse: farmhouse._id,
      $or: [
        { sender: req.user._id, receiver: counterpart },
        { sender: counterpart, receiver: req.user._id },
      ],
    })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    res.set('Cache-Control', 'no-store');
    res.json({ messages, owner: farmhouse.owner, title: farmhouse.title });
  } catch (error) {
    res.status(400).json({ message: 'Unable to load conversation.', error: error.message });
  }
}

export async function ownerInbox(req, res) {
  try {
    const farmhouses = await Farmhouse.find({ owner: req.user._id }).select('_id title');
    const farmhouseIds = farmhouses.map((farmhouse) => farmhouse._id);

    const messages = await ChatMessage.find({ farmhouse: { $in: farmhouseIds } })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .populate('farmhouse', 'title')
      .sort({ createdAt: -1 });

    const conversations = [];
    const seen = new Set();

    for (const message of messages) {
      const customer = message.sender?.role === 'user' ? message.sender : message.receiver;
      if (!customer?._id || !message.farmhouse?._id) continue;

      const key = `${message.farmhouse._id}:${customer._id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      conversations.push({
        farmhouse: message.farmhouse,
        user: customer,
        latestMessage: message,
      });
    }

    res.set('Cache-Control', 'no-store');
    res.json({ conversations });
  } catch (error) {
    res.status(400).json({ message: 'Unable to load chat inbox.', error: error.message });
  }
}

export async function sendMessage(req, res) {
  try {
    const { message = '', receiverId = '' } = req.body;
    const cleanMessage = String(message).trim();

    if (!cleanMessage) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const farmhouse = await Farmhouse.findById(req.params.farmhouseId).select('owner title');
    if (!farmhouse) return res.status(404).json({ message: 'Farmhouse not found.' });

    const isOwner = String(farmhouse.owner) === String(req.user._id);
    if (!isOwner && req.user.role !== 'user') {
      return res.status(403).json({ message: 'Not allowed.' });
    }

    let receiver;

    if (isOwner) {
      receiver = await getCounterpartForOwner(
        farmhouse._id,
        req.user._id,
        receiverId
      );
    } else {
      receiver = farmhouse.owner;
    }

    if (!receiver) {
      return res.status(400).json({
        message: 'Select a customer conversation before sending a reply.',
      });
    }

    const chat = await ChatMessage.create({
      farmhouse: farmhouse._id,
      sender: req.user._id,
      receiver,
      message: cleanMessage,
    });

    await chat.populate('sender', 'name role');

    await notify(
      receiver,
      `New inquiry for ${farmhouse.title}`,
      cleanMessage.slice(0, 100),
      'chat'
    );

    res.status(201).json({ message: 'Message sent.', chat });
  } catch (error) {
    res.status(400).json({
      message: 'Could not send message.',
      error: error.message,
    });
  }
}
