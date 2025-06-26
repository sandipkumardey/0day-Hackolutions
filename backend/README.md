# Hack0Sol Backend API

Backend API for Hack0Sol - A platform for organizing and participating in hackathons.

## Features

- User authentication (JWT)
- Email verification
- Password reset
- Role-based authorization
- Hackathon management
- Team management
- Payment integration (Razorpay)
- File uploads

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/hack0sol-backend.git
   cd hack0sol-backend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## API Documentation

### Authentication

#### Register a new user
```http
POST /api/auth/register
```

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Forgot Password
```http
POST /api/auth/forgotpassword
```

**Request Body**
```json
{
  "email": "john@example.com"
}
```

#### Reset Password
```http
PUT /api/auth/resetpassword/:resettoken
```

**Request Body**
```json
{
  "password": "newpassword123"
}
```

#### Verify Email
```http
GET /api/auth/verify-email/:verificationToken
```

#### Get Current User
```http
GET /api/auth/me
```

#### Update User Details
```http
PUT /api/auth/updatedetails
```

**Request Body**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

#### Update Password
```http
PUT /api/auth/updatepassword
```

**Request Body**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

#### Logout
```http
GET /api/auth/logout
```

## Environment Variables

See `.env.example` for all available environment variables.

## Development

- Run in development mode: `npm run dev`
- Run tests: `npm test`
- Lint code: `npm run lint`
- Format code: `npm run format`

## Production

- Build: `npm run build`
- Start: `npm start`

## License

MIT
