import { Router } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import multer from "multer";
import fs from "fs";

const prisma = new PrismaClient();
const userRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Multer setup for the file upload sim..
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads"; // backend root folder
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// GET all users, just for testing purposes..
userRouter.get("/getuser", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, pan: true, wallet: true, createdAt: true }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Signup endpoint..
userRouter.post("/signup", upload.single("idFile"), async (req, res) => {
  try {
    const { name, email, password, pan } = req.body;
    const idFile = req.file;

    if (!idFile) {
      return res.status(400).json({ message: "ID file is required!" });
    }

    // Check if user already exists..
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // Delete the uploaded file
      await fs.promises.unlink(idFile.path);
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in the DB..
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        pan
      },
      select: { id: true, name: true, email: true, pan: true, wallet: true, createdAt: true }
    });

    res.status(201).json({ message: "User account created successfully!", newUser });
  } catch (err) {
    console.error(err);
    if (req.file) {
      // Delete the uploaded file in case of error
      try {
        await fs.promises.unlink(req.file.path);
      } catch (deleteErr) {
        console.error("Error deleting file:", deleteErr);
      }
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Login endpoint..
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email..
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "User Not Registered!" });
    }

    // Compare password..
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials!" });
    }

    // Generate JWT..
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });

    res.json({ message: "Login Successful!", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default userRouter;