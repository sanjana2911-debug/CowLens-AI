# CowLens AI 🐄

A full-stack MERN application for intelligent cattle management. Track your herd's health, vaccinations, medical records, and get AI-powered diagnostic insights.

## Tech Stack

### Frontend
- **React 18** + **Vite** (Fast development & build)
- **Tailwind CSS** (Utility-first styling)
- **React Router DOM v6** (Client-side routing)
- **Axios** (HTTP client)
- **React Icons** (Icon library)

### Backend
- **Node.js** + **Express.js** (REST API)
- **MongoDB** + **Mongoose** (Database & ODM)
- **JWT** (Authentication)
- **bcryptjs** (Password hashing)
- **Multer** (File uploads)
- **Cloudinary** (Cloud image storage - configuration only)
- **express-validator** (Input validation)

## Features

- ✅ **User Authentication** - Register, Login, JWT-protected routes
- ✅ **Dashboard** - Overview with stats, quick actions, upcoming vaccinations
- ✅ **Cow Management** - CRUD operations for cattle records
- ✅ **Health Records** - Track checkups, injuries, treatments, surgeries
- ✅ **Vaccination Tracking** - Schedule and monitor vaccinations with due dates
- ✅ **AI Diagnosis** - (Placeholder) Enter symptoms for AI-powered preliminary analysis
- ✅ **Profile Management** - Update personal information
- ✅ **Responsive Design** - Mobile-friendly with sidebar navigation
- ✅ **Error Handling** - Comprehensive error handling on both client & server

## Project Structure

```
CowLens-AI/
├── client/                   # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Loading.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyCows.jsx
│   │   │   ├── AddCow.jsx
│   │   │   ├── CowDetails.jsx
│   │   │   ├── HealthRecords.jsx
│   │   │   ├── Vaccination.jsx
│   │   │   ├── AIDiagnosis.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── NotFound.jsx
│   │   ├── layouts/          # Layout components
│   │   │   └── DashboardLayout.jsx
│   │   ├── context/          # React context
│   │   │   └── AuthContext.jsx
│   │   ├── services/         # API services
│   │   │   └── api.js
│   │   ├── routes/           # Route configuration
│   │   │   └── AppRoutes.jsx
│   │   ├── utils/            # Utility functions
│   │   ├── assets/           # Static assets
│   │   ├── hooks/            # Custom hooks
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/                   # Node.js backend
│   ├── config/
│   │   ├── db.js            # MongoDB connection
│   │   └── cloudinary.js    # Cloudinary configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── cowController.js
│   │   ├── healthController.js
│   │   └── vaccinationController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   ├── error.js         # Error handler
│   │   └── upload.js        # File upload
│   ├── models/
│   │   ├── User.js
│   │   ├── Cow.js
│   │   ├── HealthRecord.js
│   │   └── Vaccination.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── cowRoutes.js
│   │   ├── healthRoutes.js
│   │   └── vaccinationRoutes.js
│   ├── uploads/              # Uploaded files
│   ├── index.js              # Entry point
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **MongoDB** (local instance or MongoDB Atlas)
- **Git** (optional)

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd CowLens-AI
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Configure server environment

Create a `.env` file in the `server` directory (already provided with defaults):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cowlens_ai
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

Update `MONGO_URI` with your MongoDB connection string.

### 4. Install client dependencies

```bash
cd ../client
npm install
```

### 5. Run the application

#### Start the backend (from the `server` directory):

```bash
npm run dev
```

The server will run on **http://localhost:5000**.

#### Start the frontend (from the `client` directory):

```bash
npm run dev
```

The client will run on **http://localhost:3000**.

### 6. Open the application

Navigate to **http://localhost:3000** in your browser.

## API Endpoints

### Authentication
| Method | Endpoint          | Description        | Auth |
|--------|-------------------|--------------------|------|
| POST   | /api/auth/register | Register user      | No   |
| POST   | /api/auth/login    | Login user         | No   |
| GET    | /api/auth/me       | Get current user   | Yes  |
| PUT    | /api/auth/profile  | Update profile     | Yes  |

### Cows
| Method | Endpoint               | Description        | Auth |
|--------|------------------------|--------------------|------|
| GET    | /api/cows              | Get all cows       | Yes  |
| POST   | /api/cows              | Create cow         | Yes  |
| GET    | /api/cows/:id          | Get single cow     | Yes  |
| PUT    | /api/cows/:id          | Update cow         | Yes  |
| DELETE | /api/cows/:id          | Delete cow         | Yes  |
| GET    | /api/cows/stats/dashboard | Dashboard stats | Yes  |

### Health Records
| Method | Endpoint                    | Description            | Auth |
|--------|-----------------------------|------------------------|------|
| GET    | /api/cows/:cowId/health     | Get cow health records | Yes  |
| POST   | /api/cows/:cowId/health     | Create health record   | Yes  |
| GET    | /api/health/:id             | Get single record      | Yes  |
| PUT    | /api/health/:id             | Update record          | Yes  |
| DELETE | /api/health/:id             | Delete record          | Yes  |

### Vaccinations
| Method | Endpoint                        | Description               | Auth |
|--------|---------------------------------|---------------------------|------|
| GET    | /api/cows/:cowId/vaccinations   | Get cow vaccinations      | Yes  |
| POST   | /api/cows/:cowId/vaccinations   | Create vaccination record | Yes  |
| GET    | /api/vaccinations/:id           | Get single record         | Yes  |
| PUT    | /api/vaccinations/:id           | Update record             | Yes  |
| DELETE | /api/vaccinations/:id           | Delete record             | Yes  |

## Scripts

### Server
- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload (nodemon)

### Client
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

MIT