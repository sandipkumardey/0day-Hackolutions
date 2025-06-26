import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Import models to register them with Mongoose
import './models/User';
import './models/Profile';
import './models/Hackathon';
import './models/Registration';
import './models/Team';
import './models/TeamMember';
import './models/Payout';
import './models/Transaction';
import './models/Notification';
import './models/EventStatus';
import './models/CoHost';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'JWT_COOKIE_EXPIRE',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err: Error) => console.error('MongoDB connection error:', err));

// Import routes
import authRouter from './routes/auth.routes';
import paymentRouter from './routes/payment.routes';
import payoutRouter from './routes/payout.routes';
import hackathonRouter from './routes/hackathon.routes';
import userRouter from './routes/user.routes';
import analyticsRouter from './routes/analytics.routes';

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/payouts', payoutRouter);
app.use('/api/hackathons', hackathonRouter);
app.use('/api/users', userRouter);
app.use('/api/analytics', analyticsRouter);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('Hack0Sol API is running...');
});

// 404 handler for unhandled routes
app.all('*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: `Can't find ${req.originalUrl} on this server!`
    });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal Server Error' 
  });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
