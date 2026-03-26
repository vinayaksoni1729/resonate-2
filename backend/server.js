const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const { db, storage } = require("./firebase");
const { collection, addDoc, query, where, getDocs, Timestamp } = require("firebase/firestore");
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (req.method === "HEAD") {
    return res.status(200).end();
  }
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed!'), false);
    } else {
      cb(null, true);
    }
  },
});

app.post("/api/form", upload.single("paymentProof"), async (req, res) => {
  let registrationData; // 
  
  try {
    const { teamName, numberOfMembers, trackChoice, members } = req.body;

    if (!teamName || !numberOfMembers || !trackChoice || !members || !req.file) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const parsedMembers = JSON.parse(members);

    if (parsedMembers.length > 0 && parsedMembers[0].registerNumber) {
      const leaderRegNo = parsedMembers[0].registerNumber;
      
      const registrationsRef = collection(db, "registrations");
      const q = query(
        registrationsRef,
        where("leaderRegisterNumber", "==", leaderRegNo)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return res.status(400).json({
          message: "Team leader already registered",
          duplicate: true,
        });
      }
    }

    const file = req.file;
    const timestamp = Date.now();
    const storageRef = ref(
      storage,
      `payment-proofs/${timestamp}-${file.originalname}`
    );

    await uploadBytes(storageRef, file.buffer);
    const paymentProofUrl = await getDownloadURL(storageRef);

    registrationData = {
      teamName,
      numberOfMembers: Number(numberOfMembers),
      trackChoice,
      members: parsedMembers,
      leaderRegisterNumber: parsedMembers[0]?.registerNumber || "",
      leaderEmail: parsedMembers[0]?.personalEmail || "",
      paymentProofUrl,
      
      status: "pending",        
      teamId: null,             
      checkIn: false,           
      
      createdAt: Timestamp.now(),
      submittedAt: new Date().toISOString(),
    };

    console.log("\n📤 ABOUT TO SAVE TO FIRESTORE:");
    console.log("Data:", JSON.stringify(registrationData, null, 2));
    console.log("Field Types:");
    console.log("  - status:", typeof registrationData.status, "=", registrationData.status);
    console.log("  - teamId:", typeof registrationData.teamId, "=", registrationData.teamId);
    console.log("  - checkIn:", typeof registrationData.checkIn, "=", registrationData.checkIn);
    console.log("  - teamName:", typeof registrationData.teamName);
    console.log("  - numberOfMembers:", typeof registrationData.numberOfMembers);
    console.log("  - createdAt:", registrationData.createdAt.constructor.name);
    console.log("  - submittedAt:", typeof registrationData.submittedAt);

    await addDoc(collection(db, "registrations"), registrationData);

    res.status(201).json({
      message: "Registration successful",
      success: true,
    });

  } catch (err) {
    console.error("\n❌ ERROR CAUGHT:");
    console.error("Error Name:", err.name);
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    console.error("Full Error:", JSON.stringify(err, null, 2));
    console.error("Stack:", err.stack);
    
    console.error("\n📤 Data that failed to save:");
    console.error("registrationData:", JSON.stringify(registrationData, null, 2));
    
    if (err instanceof multer.MulterError) {
      console.error("🎯 Multer Error Detected");
      return res.status(400).json({
        message: "File upload error: " + err.message,
      });
    }
    
    if (err.code === 'permission-denied' || err.message.includes('PERMISSION_DENIED')) {
      console.error("🚫 FIRESTORE PERMISSION DENIED - Check your Firestore Rules!");
      return res.status(403).json({
        message: "Firestore permission denied - check rules",
        error: err.message,
      });
    }
    
    console.error("\n📋 Returning 500 error to client");
    res.status(500).json({
      message: "Server error: " + err.message,
      errorCode: err.code,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});