# Resonate Hackathon Registration System

##  Project Overview
A full-stack team registration system for Resonate Hackathon with multi-step form validation and Firebase backend.

##  Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase project setup

##  Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - The `.env` file is already created with default settings
   - Update if needed (PORT=5000 is default)

4. Verify Firebase configuration:
   - Check `firebase.js` for correct Firebase credentials
   - Ensure Firebase Storage and Firestore are enabled in your Firebase Console

5. Start the backend server:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

   Server will run on: `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - The `.env` file is already created
   - Verify `VITE_BACKEND_URL=http://localhost:5000`

4. Start the development server:
   ```bash
   npm run dev
   ```

   Frontend will run on: `http://localhost:5173` (or the port shown in terminal)

##  Features

### Multi-Step Form Flow:
1. **Step 1: About** - Event information display
2. **Step 2: Team Details** - Team name, size, and track selection
3. **Step 3-6: Member Details** - Individual member information (2-4 members)
   - Leader (Member 1) requires additional fields: Personal Email & Phone Number
   - All members: Name, Register Number, Residential Status
4. **Final Step: Payment** - Upload payment proof

### Backend Features:
-  File upload handling with Multer
-  Firebase Storage integration for payment proofs
-  Firestore database for registration data
-  Duplicate registration prevention (by leader's register number)
-  Input validation
-  Error handling middleware
-  CORS enabled

##  API Endpoints

### POST `/api/form`
Submit team registration form

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `teamName` (string)
  - `numberOfMembers` (string: "2", "3", or "4")
  - `trackChoice` (string)
  - `members` (JSON string array)
  - `paymentProof` (file)

**Response:**
- Success (201): `{ message: "Registration successful", success: true }`
- Duplicate (400): `{ message: "Team leader already registered", duplicate: true }`
- Error (500): `{ message: "Server error: ..." }`

### GET `/`
Health check endpoint

##  Dependencies

### Backend:
- express - Web framework
- cors - Cross-origin resource sharing
- multer - File upload handling
- firebase - Firebase SDK
- dotenv - Environment variable management

### Frontend:
- React + Vite
- Material-UI (@mui/material)
- Framer Motion - Animations
- Axios - HTTP client

##  Database Schema

### Firestore Collection: `registrations`
```javascript
{
  teamName: string,
  numberOfMembers: number,
  trackChoice: string,
  members: [
    {
      name: string,
      registerNumber: string,
      residentialStatus: string,
      personalEmail: string (leader only),
      phoneNumber: string (leader only)
    }
  ],
  leaderRegisterNumber: string,
  leaderEmail: string,
  paymentProofUrl: string,
  createdAt: number,
  submittedAt: string (ISO format)
}
```

##  Firebase Storage Structure
```
payment-proofs/
  ├── {timestamp}-{filename}.jpg
  ├── {timestamp}-{filename}.png
  └── ...
```

##  Troubleshooting

### Common Issues:

1. **CORS Error:**
   - Ensure backend is running on port 5000
   - Check frontend .env has correct VITE_BACKEND_URL

2. **File Upload Fails:**
   - Check file size (max 5MB)
   - Verify only image files are uploaded
   - Ensure Firebase Storage rules allow uploads

3. **Duplicate Registration Error:**
   - This is intentional - prevents re-registration with same leader
   - Use different register number for testing

4. **Form Validation Errors:**
   - Register number must match format: RA + 13 digits
   - Phone number must be exactly 10 digits
   - Email must be valid format

##  Testing the Application

1. Start both backend and frontend servers
2. Open browser to frontend URL
3. Navigate through form steps:
   - View event information
   - Enter team details
   - Fill member information
   - Upload payment proof
4. Submit and verify success message

##  Validation Rules

- **Team Name:** Required
- **Number of Members:** Required (2-4)
- **Track Choice:** Required
- **Member Name:** Required, alphabets only
- **Register Number:** Required, format RA{13 digits}
- **Personal Email (Leader):** Required, valid email
- **Phone Number (Leader):** Required, exactly 10 digits
- **Residential Status:** Required (Hosteller/Day Scholar)
- **Payment Proof:** Required, image files only

##  Deployment Notes

### Backend:
- Update Firebase credentials for production
- Set NODE_ENV=production
- Configure proper CORS origins
- Use environment variables for sensitive data

### Frontend:
- Update VITE_BACKEND_URL to production URL
- Build for production: `npm run build`
- Deploy dist folder

##  Support
For issues or questions, contact the development team.

---
Built with ❤️ for Resonate Hackathon
