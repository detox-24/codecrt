<<<<<<< HEAD
# codecrt
=======
# CodeCRT - Collaborative Code Editor

CodeCRT is a full-stack web application for real-time collaborative code editing with a Matrix-inspired interface. The application allows multiple users to code together in real-time with features like syntax highlighting, code execution, and a retro CRT-styled UI.

## Features

- Real-time collaborative code editing with multi-cursor support
- Code execution for multiple programming languages (Python, JavaScript, C++, etc.)
- Matrix-style rain animation background
- Retro CRT-styled execution panel with scanlines and glow effects
- User presence indicators showing who's currently editing
- Session management for creating and joining collaborative rooms

## Tech Stack

- **Frontend**: Angular 19.2.0, Tailwind CSS, Monaco Editor
- **Backend**: Express.js, Y.js WebSocket server
- **Database**: MongoDB with Mongoose
- **Real-time Collaboration**: Y.js CRDT library
- **Code Execution**: Judge0 API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance (local or Atlas)
- Judge0 API key from RapidAPI

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/codecrt.git
   cd codecrt
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file with your MongoDB connection string and Judge0 API key.

4. Start the development servers:
   ```
   npm run dev
   ```

## Development

- Frontend: Angular application runs on `http://localhost:4200`
- Backend: Express API runs on `http://localhost:3000`
- Y.js WebSocket server runs on `ws://localhost:1234`

## Deployment

1. Build the Angular application:
   ```
   npm run build
   ```

2. Deploy the backend (Express) and WebSocket servers using a service like Heroku, Render, or DigitalOcean.

## License

MIT
>>>>>>> 6d2d67f (First commit)
