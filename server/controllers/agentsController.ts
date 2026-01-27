import { Request, Response } from 'express';
import { prisma } from '../db';

export class AgentsController {
  // Get all agents
  async getAllAgents(req: Request, res: Response) {
    try {
      const agents = await prisma.agent.findMany({
        include: {
          agency: {
            select: { name: true, logo: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(agents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch agents' });
    }
  }

  // Get single agent
  async getAgent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const agent = await prisma.agent.findUnique({
        where: { id: Number(id) },
        include: {
          agency: {
            select: { name: true, logo: true, primaryColor: true, secondaryColor: true }
          }
        }
      });

      if (!agent) {
        return res.status(404).json({ success: false, error: 'Agent not found' });
      }

      res.json(agent);
    } catch (error) {
      console.error('Error fetching agent:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch agent' });
    }
  }

  // Get rental properties for an agent
  async getAgentProperties(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const properties = await prisma.property.findMany({
        where: { createdById: Number(id) },
        include: {
          agency: {
            select: { name: true, logo: true }
          },
          createdBy: {
            select: { name: true, email: true, phone: true }
          },
          availability: {
            where: { isAvailable: true },
            orderBy: { startDate: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(properties);
    } catch (error) {
      console.error('Error fetching agent properties:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch properties' });
    }
  }

  // Get sales properties for an agent
  async getAgentSalesProperties(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const salesProperties = await prisma.salesProperty.findMany({
        where: { agentId: Number(id) },
        include: {
          agency: {
            select: { name: true, logo: true }
          },
          agent: {
            select: { name: true, email: true, phone: true }
          },
          transactions: {
            select: { id: true, saleDate: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(salesProperties);
    } catch (error) {
      console.error('Error fetching agent sales properties:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch sales properties' });
    }
  }
}

export default new AgentsController();
