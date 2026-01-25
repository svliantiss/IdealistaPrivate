// src/controllers/public/rental.controller.ts
import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { db } from 'server/db';


interface RentalPropertyResponse {
  id: number;
  title: string;
  description: string | null;
  location: string;
  propertyType: string;
  price: number;
  priceType: string;
  beds: number;
  baths: number;
  sqm: number;
  minimumStayValue: number;
  minimumStayUnit: string;
  classification: string | null;
  amenities: string[];
  nearestTo: string[];
  media: Array<{
    url: string;
    type: 'image' | 'video';
    title: string;
  }>;
  status: string;
  licenseNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  agency: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    logo: string | null;
  };
  agent: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  availability: Array<{
    startDate: Date;
    endDate: Date;
    isAvailable: boolean;
  }>;
}


export const getRentalProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid property ID'
      });
    }

    // Find the property with related data
    const property = await db.property.findUnique({
      where: {
        id: propertyId,
        status: 'published' // Only show published properties publicly
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            website: true,
            primaryColor: true,
            secondaryColor: true,
            logo: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true
          }
        },
        availability: {
          where: {
            endDate: {
              gte: new Date()
            }
          },
          select: {
            startDate: true,
            endDate: true,
            isAvailable: true
          },
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found or not published'
      });
    }

    // Parse media JSON
    let media = [];
    try {
      media = typeof property.media === 'string'
        ? JSON.parse(property.media)
        : property.media;
    } catch (error) {
      media = [];
    }

    // Parse amenities and nearestTo
    let amenities = [];
    let nearestTo = [];

    try {
      amenities = Array.isArray(property.amenities)
        ? property.amenities
        : JSON.parse(property.amenities as string);
    } catch (error) {
      amenities = [];
    }

    try {
      nearestTo = Array.isArray(property.nearestTo)
        ? property.nearestTo
        : JSON.parse(property.nearestTo as string);
    } catch (error) {
      nearestTo = [];
    }

    // Format the response
    const response: RentalPropertyResponse = {
      id: property.id,
      title: property.title,
      description: property.description,
      location: property.location,
      propertyType: property.propertyType,
      price: property.price.toNumber(),
      priceType: property.priceType,
      beds: property.beds,
      baths: property.baths,
      sqm: property.sqm,
      minimumStayValue: property.minimumStayValue,
      minimumStayUnit: property.minimumStayUnit,
      classification: property.classification,
      amenities,
      nearestTo,
      media,
      status: property.status,
      licenseNumber: property.licenseNumber,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      agency: property.agency,
      agent: property.createdBy,
      availability: property.availability.map(avail => ({
        startDate: avail.startDate,
        endDate: avail.endDate,
        isAvailable: avail.isAvailable
      }))
    };

    // Increment view count (you might want to track this separately)
    // For now, we'll just return the property data

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching rental property:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Additional endpoint for rental properties with pagination
export const getRentalProperties = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '12',
      location,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
      propertyType,
      amenities
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {
      status: 'published'
    };

    if (location) {
      where.location = {
        contains: location as string,
        mode: 'insensitive'
      };
    }

    if (minPrice) {
      where.price = {
        gte: new Decimal(minPrice as string)
      };
    }

    if (maxPrice) {
      where.price = {
        ...where.price,
        lte: new Decimal(maxPrice as string)
      };
    }

    if (minBeds) {
      where.beds = {
        gte: parseInt(minBeds as string)
      };
    }

    if (minBaths) {
      where.baths = {
        gte: parseInt(minBaths as string)
      };
    }

    if (propertyType) {
      where.propertyType = propertyType as string;
    }

    // Execute query with pagination
    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              phone: true,
              logo: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.property.count({ where })
    ]);

    // Format properties for response
    const formattedProperties = properties.map(property => {
      let media = [];
      try {
        media = typeof property.media === 'string'
          ? JSON.parse(property.media)
          : property.media;
      } catch (error) {
        media = [];
      }

      return {
        id: property.id,
        title: property.title,
        location: property.location,
        propertyType: property.propertyType,
        price: property.price.toNumber(),
        priceType: property.priceType,
        beds: property.beds,
        baths: property.baths,
        sqm: property.sqm,
        thumbnail: media.length > 0 ? media[0].url : null,
        agency: property.agency
      };
    });

    res.status(200).json({
      success: true,
      data: formattedProperties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching rental properties:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get similar rental properties
export const getSimilarRentalProperties = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    if (isNaN(propertyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid property ID'
      });
    }

    // First get the current property to find similar ones
    const currentProperty = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        location: true,
        propertyType: true,
        price: true,
        beds: true
      }
    });

    if (!currentProperty) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Find similar properties (same location, similar price range, same property type)
    const similarProperties = await db.property.findMany({
      where: {
        id: { not: propertyId },
        status: 'published',
        location: {
          contains: currentProperty.location.split(',')[0], // Get first part of location
          mode: 'insensitive'
        },
        propertyType: currentProperty.propertyType,
        price: {
          gte: currentProperty.price.mul(0.7), // 70% of current price
          lte: currentProperty.price.mul(1.3)  // 130% of current price
        }
      },
      include: {
        agency: {
          select: {
            name: true,
            phone: true,
            logo: true
          }
        }
      },
      take: 6,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response
    const formattedProperties = similarProperties.map(property => {
      let media = [];
      try {
        media = typeof property.media === 'string'
          ? JSON.parse(property.media)
          : property.media;
      } catch (error) {
        media = [];
      }

      return {
        id: property.id,
        title: property.title,
        location: property.location,
        propertyType: property.propertyType,
        price: property.price.toNumber(),
        priceType: property.priceType,
        beds: property.beds,
        baths: property.baths,
        sqm: property.sqm,
        thumbnail: media.length > 0 ? media[0].url : null,
        agency: property.agency
      };
    });

    res.status(200).json({
      success: true,
      data: formattedProperties
    });

  } catch (error) {
    console.error('Error fetching similar properties:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

interface SalesPropertyResponse {
  id: number;
  title: string;
  description: string | null;
  location: string;
  propertyType: string;
  price: number;
  beds: number;
  baths: number;
  sqm: number;
  amenities: string[];
  nearestTo: string[];
  media: Array<{
    url: string;
    type: 'image' | 'video';
    title: string;
  }>;
  status: string;
  licenseNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  agency: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    logo: string | null;
  };
  agent: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
}



export const getSalesProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    console.log(`Fetching sales property with ID: ${propertyId}`);

    if (isNaN(propertyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid property ID'
      });
    }

    // Find the sales property with related data
    const property = await db.salesProperty.findUnique({
      where: {
        id: propertyId
        // Removed status filter for debugging - add it back later: status: 'published'
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            website: true,
            primaryColor: true,
            secondaryColor: true,
            logo: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true
          }
        }
      }
    });

    console.log('Found property:', property);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check if property is published (optional for now - remove comment for production)
    // if (property.status !== 'published') {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Property is not published'
    //   });
    // }

    // Parse media JSON - handle different formats
    let media = [];
    try {
      if (typeof property.media === 'string') {
        media = JSON.parse(property.media);
      } else if (Array.isArray(property.media)) {
        media = property.media;
      } else {
        media = [];
      }
    } catch (error) {
      console.error('Error parsing media:', error);
      media = [];
    }

    console.log('Parsed media:', media);

    // Parse amenities
    let amenities = [];
    try {
      if (Array.isArray(property.amenities)) {
        amenities = property.amenities;
      } else if (typeof property.amenities === 'string') {
        amenities = JSON.parse(property.amenities);
      }
    } catch (error) {
      console.error('Error parsing amenities:', error);
      amenities = [];
    }

    // Parse nearestTo
    let nearestTo = [];
    try {
      if (Array.isArray(property.nearestTo)) {
        nearestTo = property.nearestTo;
      } else if (typeof property.nearestTo === 'string') {
        nearestTo = JSON.parse(property.nearestTo);
      }
    } catch (error) {
      console.error('Error parsing nearestTo:', error);
      nearestTo = [];
    }

    console.log('Parsed amenities:', amenities);
    console.log('Parsed nearestTo:', nearestTo);

    // Calculate price per square meter
    const price = typeof property.price === 'object' ? property.price.toNumber() : Number(property.price);
    const pricePerSqm = property.sqm > 0 ? price / property.sqm : 0;

    // Format the response
    const response: SalesPropertyResponse = {
      id: property.id,
      title: property.title,
      description: property.description,
      location: property.location,
      propertyType: property.propertyType,
      price,
      beds: property.beds,
      baths: property.baths,
      sqm: property.sqm,
      amenities,
      nearestTo,
      media,
      status: property.status,
      licenseNumber: property.licenseNumber,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      agency: property.agency,
      agent: property.agent
    };

    // Return additional calculated fields
    const responseData = {
      ...response,
      pricePerSqm: pricePerSqm.toFixed(2),
      mortgage: {
        downPayment: (price * 0.2).toFixed(0),
        loanAmount: (price * 0.8).toFixed(0),
        monthlyPayment: (price * 0.8 * 0.004).toFixed(0)
      }
    };

    console.log('Sending response:', responseData);

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    console.error('Error fetching sales property:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// Additional endpoint for sales properties with pagination
export const getSalesProperties = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '12',
      location,
      minPrice,
      maxPrice,
      minBeds,
      minBaths,
      propertyType,
      minSqm,
      maxSqm
    } = req.query;

    console.log('Fetching sales properties with query:', req.query);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {
      // Removed for debugging - add back for production: status: 'published'
    };

    if (location) {
      where.location = {
        contains: location as string,
        mode: 'insensitive'
      };
    }

    if (minPrice) {
      where.price = {
        gte: new Decimal(minPrice as string)
      };
    }

    if (maxPrice) {
      where.price = {
        ...where.price,
        lte: new Decimal(maxPrice as string)
      };
    }

    if (minBeds) {
      where.beds = {
        gte: parseInt(minBeds as string)
      };
    }

    if (minBaths) {
      where.baths = {
        gte: parseInt(minBaths as string)
      };
    }

    if (propertyType) {
      where.propertyType = propertyType as string;
    }

    if (minSqm) {
      where.sqm = {
        gte: parseInt(minSqm as string)
      };
    }

    if (maxSqm) {
      where.sqm = {
        ...where.sqm,
        lte: parseInt(maxSqm as string)
      };
    }

    console.log('Query where clause:', where);

    // Execute query with pagination
    const [properties, total] = await Promise.all([
      db.salesProperty.findMany({
        where,
        include: {
          agency: {
            select: {
              id: true,
              name: true,
              phone: true,
              logo: true
            }
          },
          agent: {
            select: {
              name: true,
              phone: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.salesProperty.count({ where })
    ]);

    console.log(`Found ${properties.length} properties out of ${total} total`);

    // Format properties for response
    const formattedProperties = properties.map(property => {
      // Parse media
      let media = [];
      try {
        if (typeof property.media === 'string') {
          media = JSON.parse(property.media);
        } else if (Array.isArray(property.media)) {
          media = property.media;
        }
      } catch (error) {
        console.error(`Error parsing media for property ${property.id}:`, error);
        media = [];
      }

      const price = typeof property.price === 'object' ? property.price.toNumber() : Number(property.price);
      const pricePerSqm = property.sqm > 0 ? price / property.sqm : 0;

      return {
        id: property.id,
        title: property.title,
        location: property.location,
        propertyType: property.propertyType,
        price,
        pricePerSqm: pricePerSqm.toFixed(2),
        beds: property.beds,
        baths: property.baths,
        sqm: property.sqm,
        thumbnail: media.length > 0 ? media[0].url : null,
        agency: property.agency,
        agent: property.agent,
        status: property.status
      };
    });

    res.status(200).json({
      success: true,
      data: formattedProperties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error: any) {
    console.error('Error fetching sales properties:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

// Get similar sales properties
export const getSimilarSalesProperties = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    console.log(`Fetching similar properties for sales property ID: ${propertyId}`);

    if (isNaN(propertyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid property ID'
      });
    }

    // First get the current property to find similar ones
    const currentProperty = await db.salesProperty.findUnique({
      where: { id: propertyId },
      select: {
        location: true,
        propertyType: true,
        price: true,
        beds: true,
        sqm: true
      }
    });

    console.log('Current property:', currentProperty);

    if (!currentProperty) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Convert price to number if it's a Decimal object
    const currentPrice = typeof currentProperty.price === 'object'
      ? currentProperty.price.toNumber()
      : Number(currentProperty.price);

    // Find similar properties
    const similarProperties = await db.salesProperty.findMany({
      where: {
        id: { not: propertyId },
        // Removed for debugging: status: 'published',
        OR: [
          {
            location: {
              contains: currentProperty.location.split(',')[0],
              mode: 'insensitive'
            }
          },
          {
            propertyType: currentProperty.propertyType
          }
        ],
        price: {
          gte: currentPrice * 0.7,
          lte: currentPrice * 1.3
        }
      },
      include: {
        agency: {
          select: {
            name: true,
            phone: true,
            logo: true
          }
        },
        agent: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      take: 6,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${similarProperties.length} similar properties`);

    // Format response
    const formattedProperties = similarProperties.map(property => {
      // Parse media
      let media = [];
      try {
        if (typeof property.media === 'string') {
          media = JSON.parse(property.media);
        } else if (Array.isArray(property.media)) {
          media = property.media;
        }
      } catch (error) {
        console.error(`Error parsing media for property ${property.id}:`, error);
        media = [];
      }

      const price = typeof property.price === 'object' ? property.price.toNumber() : Number(property.price);
      const pricePerSqm = property.sqm > 0 ? price / property.sqm : 0;

      return {
        id: property.id,
        title: property.title,
        location: property.location,
        propertyType: property.propertyType,
        price,
        pricePerSqm: pricePerSqm.toFixed(2),
        beds: property.beds,
        baths: property.baths,
        sqm: property.sqm,
        thumbnail: media.length > 0 ? media[0].url : null,
        agency: property.agency,
        agent: property.agent
      };
    });

    res.status(200).json({
      success: true,
      data: formattedProperties
    });

  } catch (error: any) {
    console.error('Error fetching similar sales properties:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
