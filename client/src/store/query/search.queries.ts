// src/store/query/search.queries.ts
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface AmenityFilter {
    id: string;
    label: string;
    checked: boolean;
    subFilters?: AmenityFilter[];
}

interface SearchFilters {
    location?: string;
    propertyType?: string;
    minBeds?: string;
    minBaths?: string;
    minPrice?: string;
    maxPrice?: string;
    minSqm?: string;
    maxSqm?: string;
    checkIn?: string;
    checkOut?: string;
    amenities?: AmenityFilter[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

interface SearchResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
    filters?: {
        location?: string | null;
        minPrice?: string | null;
        maxPrice?: string | null;
        minBeds?: string | null;
        minBaths?: string | null;
        minSqm?: string | null;
        maxSqm?: string | null;
        propertyType?: string | null;
        amenities?: AmenityFilter[];
        checkIn?: string | null;
        checkOut?: string | null;
    };
}

interface RentalProperty {
    id: number;
    title: string;
    description: string;
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
    thumbnail: string | null;
    media: Array<{
        url: string;
        type: 'image' | 'video';
        title: string;
    }>;
    status: string;
    agency: {
        id: number;
        name: string;
        phone: string | null;
        logo: string | null;
    };
    hasBookedDates: boolean;
    createdAt: string;
    updatedAt: string;
}

interface SalesProperty {
    id: number;
    title: string;
    description: string;
    location: string;
    propertyType: string;
    price: number;
    pricePerSqm: string;
    beds: number;
    baths: number;
    sqm: number;
    amenities: string[];
    nearestTo: string[];
    thumbnail: string | null;
    media: Array<{
        url: string;
        type: 'image' | 'video';
        title: string;
    }>;
    status: string;
    licenseNumber: string | null;
    agency: {
        id: number;
        name: string;
        phone: string | null;
        logo: string | null;
    };
    agent: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
    };
    mortgage: {
        downPayment: string;
        loanAmount: string;
        monthlyPayment: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Helper function to build query string
const buildQueryString = (filters: SearchFilters): string => {
    const params = new URLSearchParams();

    if (filters.location) params.append('location', filters.location);
    if (filters.propertyType && filters.propertyType !== 'all') params.append('propertyType', filters.propertyType);
    if (filters.minBeds && filters.minBeds !== 'any') params.append('minBeds', filters.minBeds);
    if (filters.minBaths && filters.minBaths !== 'any') params.append('minBaths', filters.minBaths);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.minSqm) params.append('minSqm', filters.minSqm);
    if (filters.maxSqm) params.append('maxSqm', filters.maxSqm);
    if (filters.checkIn) params.append('checkIn', filters.checkIn);
    if (filters.checkOut) params.append('checkOut', filters.checkOut);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.amenities && filters.amenities.length > 0) {
        params.append('amenities', JSON.stringify(filters.amenities));
    }

    return params.toString();
};

// Fetch rental properties with advanced filtering
export const useSearchRentalProperties = (filters: SearchFilters) => {
    const queryString = useMemo(() => buildQueryString(filters), [filters]);

    return useQuery<SearchResponse<RentalProperty>>({
        queryKey: ['search', 'rentals', filters],
        queryFn: async () => {
            const response = await fetch(`http://localhost:3003/api/search/rentals?${queryString}`);
            if (!response.ok) {


                console.log({ error: response })
                throw new Error('Failed to fetch rental properties');
            }
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        enabled: Object.keys(filters).length > 0,
    });
};

// Fetch sales properties with advanced filtering
export const useSearchSalesProperties = (filters: SearchFilters) => {
    const queryString = useMemo(() => buildQueryString(filters), [filters]);

    return useQuery<SearchResponse<SalesProperty>>({
        queryKey: ['search', 'sales', filters],
        queryFn: async () => {
            const response = await fetch(`http://localhost:3003/api/search/sales?${queryString}`);
            if (!response.ok) {
                throw new Error('Failed to fetch sales properties');
            }
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        enabled: Object.keys(filters).length > 0,
    });
};

// Get filter options (locations, property types, etc.)
export const useSearchFilterOptions = (type: 'rentals' | 'sales' = 'rentals') => {
    return useQuery({
        queryKey: ['search', 'filters', type],
        queryFn: async () => {
            const response = await fetch(`http://localhost:3003/api/search/filters?type=${type}`);
            if (!response.ok) {
                throw new Error('Failed to fetch filter options');
            }
            return response.json();
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
    });
};

// Quick search for autocomplete
export const useQuickSearch = (query: string, type: 'both' | 'rentals' | 'sales' = 'both') => {
    return useQuery({
        queryKey: ['search', 'quick', query, type],
        queryFn: async () => {
            if (!query || query.trim().length < 2) {
                return { success: true, data: [] };
            }

            const response = await fetch(`http://localhost:3003/api/search/quick?q=${encodeURIComponent(query)}&type=${type}`);
            if (!response.ok) {
                throw new Error('Failed to perform quick search');
            }
            return response.json();
        },
        staleTime: 1 * 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        enabled: query.trim().length >= 2,
    });
};

// Helper to get agent by ID
export const useAgent = (agentId?: number) => {
    return useQuery({
        queryKey: ['agents', agentId],
        queryFn: async () => {
            if (!agentId) return null;

            const response = await fetch(`http://localhost:3003/api/agents/${agentId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch agent');
            }
            return response.json();
        },
        enabled: !!agentId,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });
};

// Get property availability
export const usePropertyAvailability = (propertyId?: number) => {
    return useQuery({
        queryKey: ['property-availability', propertyId],
        queryFn: async () => {
            if (!propertyId) return [];

            const response = await fetch(`http://localhost:3003/api/property-availability/${propertyId}`);
            if (!response.ok) {
                return [];
            }
            return response.json();
        },
        enabled: !!propertyId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};