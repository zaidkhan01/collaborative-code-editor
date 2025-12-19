# Collaborative Code Editor

A real-time collaborative code editor that enables multiple developers to write, edit, and execute code together in the same workspace.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-black)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)

## ✨ Features

### 🔄 Real-time Collaboration
- **Live code syncing** - See changes from other users instantly
- **Cursor tracking** - View where other participants are editing
- **Multi-user editing** - Multiple developers can edit simultaneously

### 💻 Code Editor
- **Monaco Editor** - The same editor that powers VS Code
- **Syntax highlighting** - Support for multiple programming languages
- **IntelliSense** - Code completion and suggestions
- **Line numbers, folding, and minimap**

### 🚀 Code Execution
- **Multi-language support** - JavaScript, Python, Java, C++, Go
- **Secure execution** - Runs code in isolated Docker containers
- **Local fallback** - JavaScript/Python can run without Docker
- **Execution timeout** - Prevents infinite loops

### 💬 Communication
- **Real-time chat** - Built-in chat panel for team communication
- **Participant list** - See who's in the room
- **Join/leave notifications**

### 🔐 Authentication & Rooms
- **User registration & login** - JWT-based authentication
- **Create private rooms** - Each room has a unique ID
- **Invite via link** - Share room link to collaborate
- **Room ownership** - Room creators can manage settings

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editor
- **Socket.IO Client** - Real-time communication
- **React Router** - Navigation
- **Zustand** - State management

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.IO** - WebSocket server
- **MongoDB** - Database
- **Redis** - Real-time data & caching
- **Docker** - Secure code execution
- **JWT** - Authentication

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- Docker (optional, for secure code execution)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd collaborative-code-editor
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collaborative-code-editor
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

4. **Start MongoDB & Redis**
```bash
# Using Homebrew (macOS)
brew services start mongodb-community
brew services start redis
```

5. **Run the application**
```bash
npm run dev
```

This starts:
- Backend server: http://localhost:5000
- Frontend: http://localhost:5173

## 🖥️ Usage

1. **Register/Login** - Create an account or sign in
2. **Create a Room** - Click "Create Room" on the dashboard
3. **Share the Link** - Copy the invite link to share with collaborators
4. **Code Together** - Write code, see live changes, and chat
5. **Run Code** - Click "Run Code" to execute and see output

## 📁 Project Structure

```
collaborative-code-editor/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API & socket services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helper functions
│   └── ...
├── server/                 # Backend Node.js app
│   ├── config/             # Database configuration
│   ├── middleware/         # Express middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   └── services/           # Business logic
└── ...
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run server:dev` | Start only the backend server |
| `npm run client:dev` | Start only the frontend |
| `npm run build` | Build the frontend for production |
| `npm start` | Start the production server |
| `npm run install:all` | Install all dependencies |

## 🐳 Docker Support

For secure code execution, install and run Docker Desktop:
- [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

Without Docker, JavaScript and Python will run locally (less secure but works for development).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Zaid Khan**

---

⭐ Star this repo if you found it helpful!

