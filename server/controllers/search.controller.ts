// src/controllers/public/search.controller.ts
import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { db } from 'server/db';

// Define amenity filter structure matching frontend
interface AmenityFilter {
    id: string;
    label: string;
    checked: boolean;
    subFilters?: AmenityFilter[];
}

// Common amenity mappings for both rental and sales
const AMENITY_MAPPINGS = {
    // Rental amenities
    rentals: {
        pool: ['pool', 'swimming pool'],
        parking: ['parking', 'garage', 'carport'],
        wifi: ['wifi', 'internet', 'wireless'],
        ac: ['air conditioning', 'ac', 'a/c'],
        sea_view: ['sea view', 'ocean view', 'water view'],
        garden: ['garden', 'yard', 'outdoor space'],
        bbq: ['bbq', 'barbecue', 'grill'],
        terrace: ['terrace', 'patio', 'balcony'],
        gym: ['gym', 'fitness', 'exercise'],
        pets: ['pet friendly', 'pets allowed', 'dogs allowed'],
        security: ['security', 'alarm', 'security system'],
        elevator: ['elevator', 'lift'],
        // Sub-filters
        heated: ['heated pool', 'pool heating'],
        garage: ['garage', 'covered parking', 'carport'],
        beachfront: ['beachfront', 'beach access', 'oceanfront']
    },

    // Sales amenities
    sales: {
        pool: ['pool', 'swimming pool'],
        parking: ['parking', 'garage', 'carport'],
        sea_view: ['sea view', 'ocean view', 'water view'],
        garden: ['garden', 'yard', 'landscaped'],
        terrace: ['terrace', 'patio', 'balcony'],
        security: ['security', 'alarm', 'gated'],
        golf: ['golf', 'golf course', 'golf community'],
        gym: ['gym', 'fitness center', 'exercise room'],
        concierge: ['concierge', 'doorman', 'security desk'],
        wine_cellar: ['wine cellar', 'wine storage'],
        home_office: ['home office', 'study', 'office'],
        guest_house: ['guest house', 'guest quarters', 'casita'],
        // Sub-filters
        heated_pool: ['heated pool', 'pool heating'],
        infinity_pool: ['infinity pool', 'vanishing edge pool'],
        beach_access: ['beach access', 'private beach'],
        golf_view: ['golf view', 'golf course view']
    }
};

/**
 * Parse amenity filters from query string
 */
const parseAmenityFilters = (amenitiesQuery: string, type: 'rentals' | 'sales'): AmenityFilter[] => {
    if (!amenitiesQuery) return [];

    try {
        const filters: AmenityFilter[] = JSON.parse(amenitiesQuery);
        return Array.isArray(filters) ? filters : [];
    } catch (error) {
        console.error('Error parsing amenity filters:', error);
        return [];
    }
};

/**
 * Generate Prisma filter for amenities
 */
const buildAmenityFilter = (filters: AmenityFilter[], type: 'rentals' | 'sales') => {
    const amenityMappings = AMENITY_MAPPINGS[type];
    const requiredAmenities: string[] = [];

    // Process main filters
    filters.forEach(filter => {
        if (filter.checked) {
            const mappings = amenityMappings[filter.id as keyof typeof amenityMappings];
            if (mappings) {
                requiredAmenities.push(...mappings);
            }
        }

        // Process sub-filters
        if (filter.subFilters) {
            filter.subFilters.forEach(subFilter => {
                if (subFilter.checked) {
                    const subMappings = amenityMappings[subFilter.id as keyof typeof amenityMappings];
                    if (subMappings) {
                        requiredAmenities.push(...subMappings);
                    }
                }
            });
        }
    });

    // Remove duplicates
    const uniqueAmenities = [...new Set(requiredAmenities)];

    // Build Prisma filter
    if (uniqueAmenities.length === 0) {
        return undefined;
    }

    return {
        amenities: {
            array_contains: uniqueAmenities
        }
    };
};

/**
 * Build property type filter
 */
const buildPropertyTypeFilter = (propertyType: string | string[]) => {
    if (!propertyType || propertyType === 'all') {
        return undefined;
    }

    if (Array.isArray(propertyType)) {
        return {
            propertyType: {
                in: propertyType
            }
        };
    }

    return {
        propertyType: propertyType
    };
};

/**
 * Build price filter
 */
const buildPriceFilter = (minPrice?: string, maxPrice?: string) => {
    const filter: any = {};

    if (minPrice) {
        filter.gte = new Decimal(minPrice);
    }

    if (maxPrice) {
        filter.lte = new Decimal(maxPrice);
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
};

/**
 * Build size filter (for sales)
 */
const buildSizeFilter = (minSqm?: string, maxSqm?: string) => {
    const filter: any = {};

    if (minSqm) {
        filter.gte = parseInt(minSqm);
    }

    if (maxSqm) {
        filter.lte = parseInt(maxSqm);
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
};

/**
 * Search rental properties with advanced filtering
 */
export const searchRentalProperties = async (req: Request, res: Response) => {
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
            amenities: amenitiesQuery,
            checkIn,
            checkOut,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        console.log('Received rental search query:', req.query);
        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
        const skip = (pageNum - 1) * limitNum;

        // Parse amenity filters
        const amenityFilters = parseAmenityFilters(amenitiesQuery as string, 'rentals');

        // Build comprehensive where clause
        const where: any = {
            status: 'published'
        };

        // Location filter
        if (location) {
            where.location = {
                contains: location as string,
                mode: 'insensitive'
            };
        }

        // Property type filter
        const propertyTypeFilter = buildPropertyTypeFilter(propertyType as string);
        if (propertyTypeFilter) {
            Object.assign(where, propertyTypeFilter);
        }

        // Price filter
        const priceFilter = buildPriceFilter(minPrice as string, maxPrice as string);
        if (priceFilter) {
            where.price = priceFilter;
        }

        // Bedrooms filter
        if (minBeds) {
            where.beds = {
                gte: parseInt(minBeds as string)
            };
        }

        // Bathrooms filter
        if (minBaths) {
            where.baths = {
                gte: parseInt(minBaths as string)
            };
        }

        // Amenity filter
        const amenityFilter = buildAmenityFilter(amenityFilters, 'rentals');
        if (amenityFilter) {
            Object.assign(where, amenityFilter);
        }

        // Date availability filter (if checkIn/checkOut provided)
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn as string);
            const checkOutDate = new Date(checkOut as string);

            // Find properties that have availability for the entire period
            // This is a simplified approach - you might need a more complex query
            where.availability = {
                some: {
                    startDate: {
                        lte: checkInDate
                    },
                    endDate: {
                        gte: checkOutDate
                    },
                    isAvailable: true
                }
            };
        }

        console.log('Rental search where clause:', JSON.stringify(where, null, 2));

        // Build orderBy clause
        const orderBy: any = {};
        if (sortBy === 'price') {
            orderBy.price = sortOrder;
        } else if (sortBy === 'createdAt') {
            orderBy.createdAt = sortOrder;
        } else if (sortBy === 'title') {
            orderBy.title = sortOrder;
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
                },
                skip,
                take: limitNum,
                orderBy
            }),
            db.property.count({ where })
        ]);

        // Format properties for response
        const formattedProperties = properties.map(property => {
            // Parse media
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

            // Calculate if property has booked dates
            const hasBookedDates = property.availability.some(avail => !avail.isAvailable);

            return {
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
                thumbnail: media.length > 0 ? media[0].url : null,
                media,
                status: property.status,
                agency: property.agency,
                hasBookedDates,
                createdAt: property.createdAt,
                updatedAt: property.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            data: formattedProperties,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasMore: pageNum * limitNum < total
            },
            filters: {
                location: location || null,
                minPrice: minPrice || null,
                maxPrice: maxPrice || null,
                minBeds: minBeds || null,
                minBaths: minBaths || null,
                propertyType: propertyType || null,
                amenities: amenityFilters,
                checkIn: checkIn || null,
                checkOut: checkOut || null
            }
        });

    } catch (error: any) {
        console.error('Error searching rental properties:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Search sales properties with advanced filtering
 */
export const searchSalesProperties = async (req: Request, res: Response) => {
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
            maxSqm,
            amenities: amenitiesQuery,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
        const skip = (pageNum - 1) * limitNum;

        // Parse amenity filters
        const amenityFilters = parseAmenityFilters(amenitiesQuery as string, 'sales');

        // Build comprehensive where clause
        const where: any = {
            status: 'published'
        };

        // Location filter
        if (location) {
            where.location = {
                contains: location as string,
                mode: 'insensitive'
            };
        }

        // Property type filter
        const propertyTypeFilter = buildPropertyTypeFilter(propertyType as string);
        if (propertyTypeFilter) {
            Object.assign(where, propertyTypeFilter);
        }

        // Price filter
        const priceFilter = buildPriceFilter(minPrice as string, maxPrice as string);
        if (priceFilter) {
            where.price = priceFilter;
        }

        // Size filter
        const sizeFilter = buildSizeFilter(minSqm as string, maxSqm as string);
        if (sizeFilter) {
            where.sqm = sizeFilter;
        }

        // Bedrooms filter
        if (minBeds) {
            where.beds = {
                gte: parseInt(minBeds as string)
            };
        }

        // Bathrooms filter
        if (minBaths) {
            where.baths = {
                gte: parseInt(minBaths as string)
            };
        }

        // Amenity filter
        const amenityFilter = buildAmenityFilter(amenityFilters, 'sales');
        if (amenityFilter) {
            Object.assign(where, amenityFilter);
        }

        console.log('Sales search where clause:', JSON.stringify(where, null, 2));

        // Build orderBy clause
        const orderBy: any = {};
        if (sortBy === 'price') {
            orderBy.price = sortOrder;
        } else if (sortBy === 'pricePerSqm') {
            // Note: pricePerSqm would need to be calculated in the query
            orderBy.price = sortOrder;
        } else if (sortBy === 'createdAt') {
            orderBy.createdAt = sortOrder;
        } else if (sortBy === 'title') {
            orderBy.title = sortOrder;
        }

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
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                },
                skip,
                take: limitNum,
                orderBy
            }),
            db.salesProperty.count({ where })
        ]);

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
                media = [];
            }

            // Parse amenities and nearestTo
            let amenities = [];
            let nearestTo = [];

            try {
                if (Array.isArray(property.amenities)) {
                    amenities = property.amenities;
                } else if (typeof property.amenities === 'string') {
                    amenities = JSON.parse(property.amenities);
                }
            } catch (error) {
                amenities = [];
            }

            try {
                if (Array.isArray(property.nearestTo)) {
                    nearestTo = property.nearestTo;
                } else if (typeof property.nearestTo === 'string') {
                    nearestTo = JSON.parse(property.nearestTo);
                }
            } catch (error) {
                nearestTo = [];
            }

            const price = typeof property.price === 'object'
                ? property.price.toNumber()
                : Number(property.price);

            const pricePerSqm = property.sqm > 0 ? price / property.sqm : 0;

            return {
                id: property.id,
                title: property.title,
                description: property.description,
                location: property.location,
                propertyType: property.propertyType,
                price,
                pricePerSqm: pricePerSqm.toFixed(2),
                beds: property.beds,
                baths: property.baths,
                sqm: property.sqm,
                amenities,
                nearestTo,
                thumbnail: media.length > 0 ? media[0].url : null,
                media,
                status: property.status,
                licenseNumber: property.licenseNumber,
                agency: property.agency,
                agent: property.agent,
                createdAt: property.createdAt,
                updatedAt: property.updatedAt,
                mortgage: {
                    downPayment: (price * 0.2).toFixed(0),
                    loanAmount: (price * 0.8).toFixed(0),
                    monthlyPayment: (price * 0.8 * 0.004).toFixed(0) // Example: 4.8% annual / 12 months
                }
            };
        });

        res.status(200).json({
            success: true,
            data: formattedProperties,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasMore: pageNum * limitNum < total
            },
            filters: {
                location: location || null,
                minPrice: minPrice || null,
                maxPrice: maxPrice || null,
                minBeds: minBeds || null,
                minBaths: minBaths || null,
                minSqm: minSqm || null,
                maxSqm: maxSqm || null,
                propertyType: propertyType || null,
                amenities: amenityFilters
            }
        });

    } catch (error: any) {
        console.error('Error searching sales properties:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Get filter options for search (for dropdowns, etc.)
 */
export const getFilterOptions = async (req: Request, res: Response) => {
    try {
        const { type = 'rentals' } = req.query;

        // Get distinct locations
        const locations = type === 'rentals'
            ? await db.property.findMany({
                where: { status: 'published' },
                select: { location: true },
                distinct: ['location'],
                take: 50
            })
            : await db.salesProperty.findMany({
                where: { status: 'published' },
                select: { location: true },
                distinct: ['location'],
                take: 50
            });

        // Get property types
        const propertyTypes = type === 'rentals'
            ? await db.property.findMany({
                where: { status: 'published' },
                select: { propertyType: true },
                distinct: ['propertyType']
            })
            : await db.salesProperty.findMany({
                where: { status: 'published' },
                select: { propertyType: true },
                distinct: ['propertyType']
            });

        // Get price ranges
        const priceStats = type === 'rentals'
            ? await db.property.aggregate({
                where: { status: 'published' },
                _min: { price: true },
                _max: { price: true },
                _avg: { price: true }
            })
            : await db.salesProperty.aggregate({
                where: { status: 'published' },
                _min: { price: true },
                _max: { price: true },
                _avg: { price: true }
            });

        // Get size ranges (for sales)
        const sizeStats = type === 'sales'
            ? await db.salesProperty.aggregate({
                where: { status: 'published' },
                _min: { sqm: true },
                _max: { sqm: true },
                _avg: { sqm: true }
            })
            : null;

        res.status(200).json({
            success: true,
            data: {
                locations: locations.map(l => l.location),
                propertyTypes: propertyTypes.map(pt => pt.propertyType),
                priceRange: {
                    min: priceStats._min.price?.toNumber() || 0,
                    max: priceStats._max.price?.toNumber() || 0,
                    average: priceStats._avg.price?.toNumber() || 0
                },
                sizeRange: sizeStats ? {
                    min: sizeStats._min.sqm || 0,
                    max: sizeStats._max.sqm || 0,
                    average: sizeStats._avg.sqm || 0
                } : null,
                amenities: type === 'rentals' ? AMENITY_MAPPINGS.rentals : AMENITY_MAPPINGS.sales
            }
        });

    } catch (error: any) {
        console.error('Error getting filter options:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

/**
 * Quick search endpoint (for search bar autocomplete)
 */
export const quickSearch = async (req: Request, res: Response) => {
    try {
        const { q, type = 'both' } = req.query;

        if (!q || q.toString().trim().length < 2) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const searchTerm = q.toString().trim();

        const [rentalResults, salesResults] = await Promise.all([
            type === 'both' || type === 'rentals'
                ? db.property.findMany({
                    where: {
                        status: 'published',
                        OR: [
                            { title: { contains: searchTerm, mode: 'insensitive' } },
                            { location: { contains: searchTerm, mode: 'insensitive' } },
                            { description: { contains: searchTerm, mode: 'insensitive' } }
                        ]
                    },
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        propertyType: true,
                        price: true,
                        media: true
                    },
                    take: 5
                })
                : [],

            type === 'both' || type === 'sales'
                ? db.salesProperty.findMany({
                    where: {
                        status: 'published',
                        OR: [
                            { title: { contains: searchTerm, mode: 'insensitive' } },
                            { location: { contains: searchTerm, mode: 'insensitive' } },
                            { description: { contains: searchTerm, mode: 'insensitive' } }
                        ]
                    },
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        propertyType: true,
                        price: true,
                        media: true
                    },
                    take: 5
                })
                : []
        ]);

        const formattedResults = [
            ...rentalResults.map(property => ({
                id: property.id,
                title: property.title,
                location: property.location,
                propertyType: property.propertyType,
                price: property.price.toNumber(),
                type: 'rental' as const,
                thumbnail: (() => {
                    try {
                        const media = typeof property.media === 'string'
                            ? JSON.parse(property.media)
                            : property.media;
                        return Array.isArray(media) && media.length > 0 ? media[0].url : null;
                    } catch {
                        return null;
                    }
                })()
            })),
            ...salesResults.map(property => ({
                id: property.id,
                title: property.title,
                location: property.location,
                propertyType: property.propertyType,
                price: typeof property.price === 'object'
                    ? property.price.toNumber()
                    : Number(property.price),
                type: 'sale' as const,
                thumbnail: (() => {
                    try {
                        const media = typeof property.media === 'string'
                            ? JSON.parse(property.media)
                            : property.media;
                        return Array.isArray(media) && media.length > 0 ? media[0].url : null;
                    } catch {
                        return null;
                    }
                })()
            }))
        ];

        res.status(200).json({
            success: true,
            data: formattedResults
        });

    } catch (error: any) {
        console.error('Error in quick search:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};