# AI Road Trip Planner

An AI-powered road trip planner that recommends stops based on your preferences, including restaurants and gas stations.

## Features

- Plan road trips with customized stop recommendations
- User authentication system
- Food preference tracking
- Save trip history
- Interactive Google Maps integration
- MongoDB database for persistent storage

## Tech Stack

- **Frontend & Backend**: Next.js (unified application)
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Maps**: Google Maps API
- **Styling**: Tailwind CSS

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB database (Atlas or local)
- Google Maps API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-roadtrip-planner.git
   cd ai-roadtrip-planner
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Google Maps API key
   - Add your MongoDB connection string
   - Set a secure JWT secret

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_maps_api_key_here

# MongoDB URI 
MONGODB_URI=your_mongodb_connection_string_here

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_here
```

## MongoDB Setup

You have two options for setting up MongoDB:

### Option 1: MongoDB Atlas (Recommended for production)

1. Create a [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string and add it to `.env.local`

### Option 2: Local MongoDB (Development)

1. Install MongoDB locally: [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)
2. Start your local MongoDB server
3. Set your connection string to `mongodb://localhost:27017/ai-roadtrip`

## Deployment

This is a Next.js application and can be easily deployed to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/yourusername/ai-roadtrip-planner)

Make sure to set up the environment variables in your hosting provider.

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify your API keys are correct
3. Make sure MongoDB is properly connected
4. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more help

## License

This project is licensed under the MIT License - see the LICENSE file for details.
