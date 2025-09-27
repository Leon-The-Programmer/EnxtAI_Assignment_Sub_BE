import { Router, type Request, type Response } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const userRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// GET all users, just for testing purposes..
userRouter.get("/getuser", async (req: Request, res: Response) => {
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
userRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, password, pan } = req.body;

    // Check if user already exists..
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
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
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Login endpoint..
userRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email..
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // Compare password..
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials" });
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
