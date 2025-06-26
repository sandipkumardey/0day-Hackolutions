const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './.env' });

// Import all models
const User = require('../models/User');
const Profile = require('../models/Profile');
const Hackathon = require('../models/Hackathon');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const Payout = require('../models/Payout');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const EventStatus = require('../models/EventStatus');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    console.log('Clearing all existing data...');
    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      Hackathon.deleteMany({}),
      Registration.deleteMany({}),
      Team.deleteMany({}),
      TeamMember.deleteMany({}),
      Payout.deleteMany({}),
      Transaction.deleteMany({}),
      Notification.deleteMany({}),
      EventStatus.deleteMany({}),
    ]);
    console.log('All collections cleared.');

    // --- Create Users ---
    const users = await User.create([
      {
        name: 'Alice Wonder',
        email: 'alice@example.com',
        role: 'admin',
        discord_id: 'alice#1234',
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
      },
      {
        name: 'Bob Builder',
        email: 'bob@example.com',
        role: 'user',
        discord_id: 'bob#5678',
        wallet_address: '0xabcdef1234567890abcdef1234567890abcdef12',
      },
    ]);
    const [alice, bob] = users;
    console.log(`${users.length} users created.`);

    // --- Create Profiles ---
    await Profile.create([
        { user_id: alice._id, bio: 'Organizer of awesome hackathons.', skills: ['React', 'Node.js', 'Solidity'], avatar_url: 'https://i.pravatar.cc/150?u=alice' },
        { user_id: bob._id, bio: 'Full-stack developer ready to build.', skills: ['Vue', 'Python', 'Web3.js'], avatar_url: 'https://i.pravatar.cc/150?u=bob' },
    ]);
    console.log('User profiles created.');

    // --- Create Hackathons ---
    const hackathons = await Hackathon.create([
        {
            title: 'Web3 Revolution 2025',
            description: 'A hackathon for the decentralized future.',
            start_date: new Date('2025-08-01'),
            end_date: new Date('2025-08-03'),
            organizer_id: alice._id,
            discord_link: 'https://discord.gg/web3rev',
            status: 'ongoing',
        },
        {
            title: 'AI for Good',
            description: 'Using AI to solve real-world problems.',
            start_date: new Date('2025-09-15'),
            end_date: new Date('2025-09-17'),
            organizer_id: alice._id,
            discord_link: 'https://discord.gg/aiforgood',
            status: 'upcoming',
        },
    ]);
    const [web3Hackathon, aiHackathon] = hackathons;
    console.log(`${hackathons.length} hackathons created.`);

    // --- Create Registrations ---
    await Registration.create([
        { user_id: bob._id, hackathon_id: web3Hackathon._id, type: 'team', status: 'verified' },
        { user_id: bob._id, hackathon_id: aiHackathon._id, type: 'individual', status: 'registered' },
    ]);
    console.log('User registrations created.');

    // --- Create a Team ---
    const team = await Team.create({
        hackathon_id: web3Hackathon._id,
        team_name: 'The Code Crusaders',
        leader_id: bob._id,
        project_link: 'https://github.com/bob/project-x',
    });
    console.log('Team created.');

    // --- Add Team Member ---
    await TeamMember.create({ team_id: team._id, user_id: bob._id });
    console.log('Team member added.');

    // --- Create Payout & Transaction ---
    const payout = await Payout.create({
        user_id: bob._id,
        hackathon_id: web3Hackathon._id,
        amount: 500,
        method: 'crypto',
        status: 'pending',
        wallet_address: bob.wallet_address,
    });
    await Transaction.create({
        user_id: bob._id,
        amount: 500,
        status: 'pending',
        type: 'payout',
    });
    console.log('Payout and transaction created.');

    // --- Create Notification ---
    await Notification.create({
        user_id: bob._id,
        channel: 'email',
        message: 'Welcome to the Web3 Revolution Hackathon!',
    });
    console.log('Notification created.');

    // --- Create Event Statuses ---
    await EventStatus.create([
        { hackathon_id: web3Hackathon._id, phase: 'Hacking Started', current: true },
        { hackathon_id: aiHackathon._id, phase: 'Registration Open', current: true },
    ]);
    console.log('Event statuses created.');

    console.log('\nDatabase seeded successfully! 🌱');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedDatabase();
