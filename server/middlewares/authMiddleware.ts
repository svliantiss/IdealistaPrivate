import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
    const agent = await prisma.agent.findUnique({ where: { id: payload.agentId } });
    if (!agent) return res.status(401).json({ error: "Unauthorized" });
    (req as any).agent = agent;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
