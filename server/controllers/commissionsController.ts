import { Request, Response } from 'express';
import { prisma } from '../db';

export class CommissionsController {
  // Get commissions for an agent
  async getAgentCommissions(req: Request, res: Response) {
    try {
      const { agentId } = req.params;

      const commissions = await prisma.commission.findMany({
        where: {
          OR: [
            { ownerAgentId: Number(agentId) },
            { bookingAgentId: Number(agentId) }
          ]
        },
        include: {
          booking: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  location: true
                }
              }
            }
          },
          ownerAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          bookingAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(commissions);
    } catch (error) {
      console.error('Error fetching agent commissions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch commissions' });
    }
  }

  // Get all commissions (admin)
  async getAllCommissions(req: Request, res: Response) {
    try {
      const commissions = await prisma.commission.findMany({
        include: {
          booking: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  location: true
                }
              }
            }
          },
          ownerAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          bookingAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(commissions);
    } catch (error) {
      console.error('Error fetching all commissions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch commissions' });
    }
  }

  // Get sales commissions for an agent
  async getAgentSalesCommissions(req: Request, res: Response) {
    try {
      const { agentId } = req.params;

      const salesCommissions = await prisma.salesCommission.findMany({
        where: {
          OR: [
            { sellerAgentId: Number(agentId) },
            { buyerAgentId: Number(agentId) }
          ]
        },
        include: {
          transaction: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  location: true
                }
              }
            }
          },
          sellerAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          buyerAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(salesCommissions);
    } catch (error) {
      console.error('Error fetching agent sales commissions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch sales commissions' });
    }
  }

  // Get all sales commissions (admin)
  async getAllSalesCommissions(req: Request, res: Response) {
    try {
      const salesCommissions = await prisma.salesCommission.findMany({
        include: {
          transaction: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  location: true
                }
              }
            }
          },
          sellerAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          buyerAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(salesCommissions);
    } catch (error) {
      console.error('Error fetching all sales commissions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch sales commissions' });
    }
  }

  // Get all sales transactions
  async getAllSalesTransactions(req: Request, res: Response) {
    try {
      const transactions = await prisma.salesTransaction.findMany({
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true,
              propertyType: true
            }
          },
          sellerAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          buyerAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          commission: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(transactions);
    } catch (error) {
      console.error('Error fetching sales transactions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch sales transactions' });
    }
  }

  // Get all sales properties (without agent filter)
  async getAllSalesProperties(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const where: any = {};
      
      if (status) {
        where.status = status;
      }

      const salesProperties = await prisma.salesProperty.findMany({
        where,
        include: {
          agency: {
            select: { name: true, logo: true }
          },
          agent: {
            select: { id: true, name: true, email: true, phone: true }
          },
          transactions: {
            select: { id: true, saleDate: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(salesProperties);
    } catch (error) {
      console.error('Error fetching all sales properties:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch sales properties' });
    }
  }

  // Get all properties (rental)
  async getAllProperties(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const where: any = {};
      
      if (status) {
        where.status = status;
      }

      const properties = await prisma.property.findMany({
        where,
        include: {
          agency: {
            select: { name: true, logo: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true, phone: true }
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
      console.error('Error fetching all properties:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch properties' });
    }
  }

  // Get all property availability
  async getAllPropertyAvailability(req: Request, res: Response) {
    try {
      const availability = await prisma.propertyAvailability.findMany({
        include: {
          property: {
            select: {
              id: true,
              title: true,
              location: true
            }
          },
          booking: {
            select: {
              id: true,
              clientName: true,
              status: true
            }
          }
        },
        orderBy: { startDate: 'asc' }
      });

      res.json(availability);
    } catch (error) {
      console.error('Error fetching property availability:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch availability' });
    }
  }
}

export default new CommissionsController();
