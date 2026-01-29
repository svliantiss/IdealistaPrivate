// src/store/query/booking.queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api, getAuthHeader } from '@/store/api/baseApi';
import { response } from 'express';
import { resolve } from 'path';



// Types
export interface Booking {
    id: number;
    propertyId: number;
    ownerAgentId: number;
    bookingAgentId: number;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    additionNote?: string;
    checkIn: string;
    checkOut: string;
    duration: string;
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'cancellation_requested' | 'archived' | 'paid';
    createdAt: string;
    updatedAt: string;
    property?: any;
    ownerAgent?: any;
    bookingAgent?: any;
    commission?: any;
    availability?: any[];
}

export interface CreateBookingDto {
    propertyId: number;
    ownerAgentId: number;
    bookingAgentId?: number;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    additionNote?: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
}

export interface UpdateBookingDto {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    additionNote?: string;
    checkIn?: string;
    checkOut?: string;
    totalAmount?: number;
    status?: 'pending' | 'confirmed' | 'cancelled' | 'cancellation_requested' | 'archived' | 'paid';
}

export interface BookingFilters {
    page?: number;
    limit?: number;
    status?: 'pending' | 'confirmed' | 'cancelled' | 'cancellation_requested' | 'archived' | 'paid';
    propertyId?: number;
    agencyId?: number;
    agentId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
}

// Booking Queries
export const useBookings = (filters: BookingFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.propertyId) params.append('propertyId', filters.propertyId.toString());
    if (filters.agencyId) params.append('agencyId', filters.agencyId.toString());
    if (filters.agentId) params.append('agentId', filters.agentId.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `/api/bookings?${queryString}` : '/api/bookings';

    return useQuery({
        queryKey: ['bookings', filters],
        queryFn: async () => {
            console.log("start")
            try {
                const response = await api.get(url, { headers: getAuthHeader() });
                console.log({ response })
                const data = await response.data.data; // Your API already returns { success: true, data: { bookings: [], ... } }
                return data;
            } catch (error) {
                console.log({ error })
            }
        },
    });
};

export const useBooking = (id: number) => {
    return useQuery({
        queryKey: ['bookings', id],
        queryFn: async () => {
            const response = await api.get(`/api/bookings/${id}`,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        enabled: !!id,
    });
};

export const useCreateBooking = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: CreateBookingDto) => {
            const response = await api.post('/api/bookings', data,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['property-availability'] });
            toast({
                title: 'Booking Created',
                description: 'Booking has been successfully created.',
            });
            return data;
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to create booking',
                variant: 'destructive',
            });
        },
    });
};

export const useUpdateBooking = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateBookingDto }) => {
            const response = await api.put(`/api/bookings/${id}`, data,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['bookings', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['property-availability'] });
            toast({
                title: 'Booking Updated',
                description: 'Booking has been successfully updated.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to update booking',
                variant: 'destructive',
            });
        },
    });
};

export const useUpdateBookingStatus = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const response = await api.patch(`/api/bookings/${id}/status`, { status },
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['bookings', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['property-availability'] });

            const messages: Record<string, { title: string; description: string }> = {
                confirmed: { title: 'Booking Approved', description: 'The booking has been approved and dates are now blocked.' },
                cancelled: { title: 'Booking Cancelled', description: 'The booking has been cancelled and dates are now available.' },
                paid: { title: 'Booking Paid', description: 'The booking has been marked as paid.' },
                archived: { title: 'Booking Archived', description: 'The booking has been archived.' },
            };

            const message = messages[variables.status] || {
                title: 'Status Updated',
                description: 'The booking status has been updated.'
            };

            toast(message);
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to update booking status',
                variant: 'destructive',
            });
        },
    });
};

export const useRequestCancellation = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await api.patch(`/api/bookings/${id}/request-cancellation`,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['bookings', id] });
            toast({
                title: 'Cancellation Requested',
                description: 'Your cancellation request has been sent to the property owner.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to request cancellation',
                variant: 'destructive',
            });
        },
    });
};

export const useDeleteBooking = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await api.delete(`/api/bookings/${id}`,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['bookings', id] });
            queryClient.invalidateQueries({ queryKey: ['property-availability'] });
            toast({
                title: 'Booking Cancelled',
                description: 'Booking has been successfully cancelled.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to cancel booking',
                variant: 'destructive',
            });
        },
    });
};

// Property-specific bookings
export const usePropertyBookings = (propertyId: number, filters?: { startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();

    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString
        ? `/api/bookings/property/${propertyId}?${queryString}`
        : `/api/bookings/property/${propertyId}`;

    return useQuery({
        queryKey: ['property-bookings', propertyId, filters],
        queryFn: async () => {
            const response = await api.get(url,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        enabled: !!propertyId,
    });
};

// Agent-specific bookings
export const useAgentBookings = (agentId: number, filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
}) => {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString
        ? `/api/bookings/agent/${agentId}?${queryString}`
        : `/api/bookings/agent/${agentId}`;

    return useQuery({
        queryKey: ['agent-bookings', agentId, filters],
        queryFn: async () => {
            const response = await api.get(url,
                { headers: getAuthHeader() });
            return response.data;
        },
        enabled: !!agentId,
    });
};

// Agent booking requests (pending bookings from other agencies)
export const useAgentBookingRequests = (agentId: number) => {
    return useQuery({
        queryKey: ['agent-booking-requests', agentId],
        queryFn: async () => {
            const response = await api.get(`/api/bookings/agent/${agentId}/booking-requests`,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        enabled: !!agentId,
    });
};

// Agency bookings
export const useAgencyBookings = (agencyId: number, filters?: BookingFilters) => {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate || '');
    if (filters?.endDate) params.append('endDate', filters.endDate || '');
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString
        ? `/api/bookings/agency/${agencyId}?${queryString}`
        : `/api/bookings/agency/${agencyId}`;

    return useQuery({
        queryKey: ['agency-bookings', agencyId, filters],
        queryFn: async () => {
            const response = await api.get(url,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        enabled: !!agencyId,
    });
};

// Booking statistics
export const useBookingStats = (filters?: { agencyId?: number; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();

    if (filters?.agencyId) params.append('agencyId', filters.agencyId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString ? `/api/bookings/stats?${queryString}` : '/api/bookings/stats';

    return useQuery({
        queryKey: ['booking-stats', filters],
        queryFn: async () => {
            const response = await api.get(url,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
    });
};

// Helper function to calculate nights between dates
export const calculateNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to format date
export const formatBookingDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// Helper function to get status badge class
export const getBookingStatusClass = (status: string): string => {
    switch (status) {
        case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'paid': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'cancellation_requested': return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
        case 'archived': return 'bg-slate-100 text-slate-600 border-slate-300';
        default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
};

// Helper function to get status label
export const getBookingStatusLabel = (status: string): string => {
    switch (status) {
        case 'cancellation_requested': return 'Cancel Requested';
        default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
};

// Utility functions for filtering bookings
export const filterMyBookings = (bookings: Booking[], currentAgent: any, allAgents: any[]) => {
    if (!currentAgent || !allAgents.length) return [];

    const agencyAgentIds = allAgents
        .filter((agent: any) => agent.agencyId === currentAgent.agencyId)
        .map((agent: any) => agent.id);

    return bookings.filter((booking: Booking) =>
        agencyAgentIds.includes(booking.bookingAgentId)
    );
};

export const filterBookingRequests = (bookings: Booking[], currentAgent: any, allAgents: any[]) => {
    if (!currentAgent || !allAgents.length) return [];

    const agencyAgentIds = allAgents
        .filter((agent: any) => agent.agencyId === currentAgent.agencyId)
        .map((agent: any) => agent.id);

    return bookings.filter((booking: Booking) => {
        if (!['pending', 'cancellation_requested'].includes(booking.status)) return false;

        const isMyAgencyProperty = agencyAgentIds.includes(booking.ownerAgentId);
        if (!isMyAgencyProperty) return false;

        const bookingAgent = allAgents.find((agent: any) => agent.id === booking.bookingAgentId);
        const isDifferentAgency = bookingAgent?.agencyId !== currentAgent.agencyId;

        return isDifferentAgency;
    });
};

// Property Details Component Integration
// Add this to your existing property.queries.ts file or create a new file

// For PropertyDetails.tsx integration
export const useCreatePropertyBooking = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: {
            propertyId: number;
            clientName: string;
            clientEmail: string;
            clientPhone: string;
            checkIn: string;
            checkOut: string;
            totalAmount: number;
            additionNote?: string;
            ownerAgentId: number;
            bookingAgentId?: number;
        }) => {
            const response = await api.post('/api/bookings', data,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['property-availability'] });
            toast({
                title: 'Booking Created!',
                description: 'Your booking has been created successfully.',
            });
            return data;
        },
        onError: (error: any) => {
            toast({
                title: 'Booking Failed',
                description: error.response?.data?.error || 'Failed to create booking. Please try again.',
                variant: 'destructive',
            });
        },
    });
};

// For SalesPropertyDetails.tsx integration
export const useCreateSalesInquiry = () => {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: {
            propertyId: number;
            clientName: string;
            clientEmail: string;
            clientPhone: string;
            message: string;
            budget?: string;
            timeline?: string;
            financing?: boolean;
        }) => {
            // This would connect to your sales inquiry endpoint
            const response = await api.post('/api/sales-inquiries', data,
                { headers: getAuthHeader() }
            );
            return response.data;
        },
        onSuccess: () => {
            toast({
                title: 'Inquiry Sent!',
                description: 'Your inquiry has been sent to the agent. They will contact you soon.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Inquiry Failed',
                description: error.response?.data?.error || 'Failed to send inquiry. Please try again.',
                variant: 'destructive',
            });
        },
    });
};