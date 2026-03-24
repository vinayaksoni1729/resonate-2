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

    const registrationData = {
      teamName,
      numberOfMembers: Number(numberOfMembers),
      trackChoice,
      members: parsedMembers,
      leaderRegisterNumber: parsedMembers[0]?.registerNumber || "",
      leaderEmail: parsedMembers[0]?.personalEmail || "",
      paymentProofUrl,
      createdAt: Timestamp.now(),
      submittedAt: new Date().toISOString(),
    };

    await addDoc(collection(db, "registrations"), registrationData);

    res.status(201).json({
      message: "Registration successful",
      success: true,
    });

  } catch (err) {
    console.error("ERROR:", err);
    
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: "File upload error: " + err.message,
      });
    }
    
    res.status(500).json({
      message: "Server error: " + err.message,
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