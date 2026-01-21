// src/lib/api/propertiesApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:3003/api/properties';

console.log('🔧 [propertiesApi] API_BASE_URL:', API_BASE_URL);

// Types
export interface MediaItem {
  type: "image" | "video";
  url: string;
  title: string;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  location: string;
  propertyType: string;
  price: number | string;
  priceType: string;
  beds: number;
  baths: number;
  sqm: number;
  amenities: string[];
  nearestTo: string[];
  media: MediaItem[];
  status: 'draft' | 'published' | 'archived';
  classification: 'Short-Term' | 'Long-Term';
  minimumStayValue: number;
  minimumStayUnit: string;
  licenseNumber?: string;
  agencyId: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  agency?: {
    id: number;
    name: string;
    logo?: string;
  };
  createdBy?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  bookings?: any[];
  availability?: any[];
}

export interface CreatePropertyInput {
  agencyId: number;
  createdById: number;
  title: string;
  description?: string;
  location: string;
  propertyType: string;
  price: number | string;
  priceType?: string;
  beds?: number;
  baths?: number;
  sqm?: number;
  amenities?: string[];
  nearestTo?: string[];
  media?: MediaItem[];
  minimumStayValue?: number;
  minimumStayUnit?: string;
  licenseNumber?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdatePropertyInput extends Partial<CreatePropertyInput> {
  status?: 'draft' | 'published' | 'archived';
}

export interface PropertyAvailability {
  id: number;
  propertyId: number;
  startDate: string;
  endDate: string;
  isAvailable: boolean;
  notes?: string;
  bookingId?: number;
}

export interface PropertyStats {
  totalProperties: number;
  publishedProperties: number;
  totalBookings: number;
  totalRevenue: number;
  recentProperties: Property[];
}

// Auth header utility function
export const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { Authorization: token ? `Bearer ${token}` : "" };
};

// API functions
const fetchAPI = async (url: string, options?: RequestInit) => {
  console.log('📡 [fetchAPI] Making request to:', url);
  console.log('📡 [fetchAPI] Request options:', options);

  const authHeader = getAuthHeader();

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options?.headers,
    },
    ...options,
  });

  console.log('📡 [fetchAPI] Response status:', response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network response was not ok' }));
    console.error('❌ [fetchAPI] Request failed:', error);
    throw new Error(error.error || error.message || 'Request failed');
  }

  const data = await response.json();
  console.log('✅ [fetchAPI] Request successful:', data);
  return data;
};

// Custom amenities and nearest-to APIs
export const useCustomAmenities = (agentId: number) => {
  console.log('🔧 [useCustomAmenities] Fetching custom amenities for agent:', agentId);

  return useQuery({
    queryKey: ['custom-amenities', agentId],
    queryFn: () => fetchAPI(`/api/agents/${agentId}/amenities`),
    enabled: !!agentId,
  });
};

export const useCustomNearestTo = (agentId: number) => {
  console.log('🔧 [useCustomNearestTo] Fetching custom nearest-to for agent:', agentId);

  return useQuery({
    queryKey: ['custom-nearest-to', agentId],
    queryFn: () => fetchAPI(`/api/agents/${agentId}/nearest-to`),
    enabled: !!agentId,
  });
};

export const useAddCustomAmenity = (agentId: number) => {
  const queryClient = useQueryClient();

  console.log('🔧 [useAddCustomAmenity] Setting up mutation for agent:', agentId);

  return useMutation({
    mutationFn: (name: string) => {
      console.log('📝 [useAddCustomAmenity] Adding custom amenity:', name);
      return fetchAPI(`/api/agents/${agentId}/amenities`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      console.log('✅ [useAddCustomAmenity] Custom amenity added successfully');
      queryClient.invalidateQueries({ queryKey: ['custom-amenities', agentId] });
      toast.success('Custom amenity added');
    },
    onError: (error: Error) => {
      console.error('❌ [useAddCustomAmenity] Failed to add custom amenity:', error);
      toast.error(error.message || 'Failed to add custom amenity');
    },
  });
};

export const useAddCustomNearestTo = (agentId: number) => {
  const queryClient = useQueryClient();

  console.log('🔧 [useAddCustomNearestTo] Setting up mutation for agent:', agentId);

  return useMutation({
    mutationFn: (name: string) => {
      console.log('📝 [useAddCustomNearestTo] Adding custom nearest-to:', name);
      return fetchAPI(`/api/agents/${agentId}/nearest-to`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      console.log('✅ [useAddCustomNearestTo] Custom location added successfully');
      queryClient.invalidateQueries({ queryKey: ['custom-nearest-to', agentId] });
      toast.success('Custom location added');
    },
    onError: (error: Error) => {
      console.error('❌ [useAddCustomNearestTo] Failed to add custom location:', error);
      toast.error(error.message || 'Failed to add custom location');
    },
  });
};

// Rental Properties
export const useRentalProperties = (filters?: {
  agencyId?: number;
  status?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  beds?: number;
  agentId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const url = `${API_BASE_URL}/rental${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  console.log('🔧 [useRentalProperties] Fetching rental properties with filters:', filters);
  console.log('🔧 [useRentalProperties] URL:', url);

  return useQuery({
    queryKey: ['properties', 'rental', filters],
    queryFn: () => fetchAPI(url),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useRentalProperty = (id: number) => {
  console.log('🔧 [useRentalProperty] Fetching rental property with ID:', id);

  return useQuery({
    queryKey: ['properties', 'rental', id],
    queryFn: () => fetchAPI(`${API_BASE_URL}/rental/${id}`),
    enabled: !!id,
  });
};

export const useCreateRentalProperty = () => {
  const queryClient = useQueryClient();

  console.log('🔧 [useCreateRentalProperty] Setting up mutation');

  return useMutation({
    mutationFn: (data: CreatePropertyInput) => {
      console.log('📝 [useCreateRentalProperty] Creating rental property:', data);
      return fetchAPI(`${API_BASE_URL}/rental`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      console.log('✅ [useCreateRentalProperty] Property created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['properties', 'rental'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'properties'] });
      toast.success('Property created successfully');
    },
    onError: (error: Error) => {
      console.error('❌ [useCreateRentalProperty] Failed to create property:', error);
      toast.error(error.message || 'Failed to create property');
    },
  });
};

export const useUpdateRentalProperty = () => {
  const queryClient = useQueryClient();

  console.log('🔧 [useUpdateRentalProperty] Setting up mutation');

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePropertyInput }) => {
      console.log('📝 [useUpdateRentalProperty] Updating property:', id, data);
      return fetchAPI(`${API_BASE_URL}/rental/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      console.log('✅ [useUpdateRentalProperty] Property updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['properties', 'rental'] });
      queryClient.invalidateQueries({ queryKey: ['properties', 'rental', variables.id] });
      toast.success('Property updated successfully');
    },
    onError: (error: Error) => {
      console.error('❌ [useUpdateRentalProperty] Failed to update property:', error);
      toast.error(error.message || 'Failed to update property');
    },
  });
};

export const useUpdatePropertyStatus = () => {
  const queryClient = useQueryClient();

  console.log('🔧 [useUpdatePropertyStatus] Setting up mutation');

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'draft' | 'published' | 'archived' }) => {
      console.log('📝 [useUpdatePropertyStatus] Updating property status:', id, status);
      return fetchAPI(`${API_BASE_URL}/rental/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (data, variables) => {
      console.log('✅ [useUpdatePropertyStatus] Status updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['properties', 'rental'] });
      queryClient.invalidateQueries({ queryKey: ['properties', 'rental', variables.id] });
      toast.success('Status updated successfully');
    },
    onError: (error: Error) => {
      console.error('❌ [useUpdatePropertyStatus] Failed to update status:', error);
      toast.error(error.message || 'Failed to update status');
    },
  });
};

export const useDeleteRentalProperty = () => {
  const queryClient = useQueryClient();

  console.log('🔧 [useDeleteRentalProperty] Setting up mutation');

  return useMutation({
    mutationFn: (id: number) => {
      console.log('📝 [useDeleteRentalProperty] Deleting property:', id);
      return fetchAPI(`${API_BASE_URL}/rental/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (data) => {
      console.log('✅ [useDeleteRentalProperty] Property deleted successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['properties', 'rental'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'properties'] });
      toast.success('Property deleted successfully');
    },
    onError: (error: Error) => {
      console.error('❌ [useDeleteRentalProperty] Failed to delete property:', error);
      toast.error(error.message || 'Failed to delete property');
    },
  });
};

// Sales Properties
export const useSalesProperties = (filters?: {
  agencyId?: number;
  status?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  agentId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const url = `${API_BASE_URL}/sales`;
  console.log('🔧 [useSalesProperties] Fetching sales properties with filters:', filters);
  console.log('🔧 [useSalesProperties] URL:', url);

  return useQuery({
    queryKey: ['properties', 'sales', filters],
    queryFn: () => fetchAPI(url),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSalesProperty = (id: number) => {
  console.log('🔧 [useSalesProperty] Fetching sales property with ID:', id);

  return useQuery({
    queryKey: ['properties', 'sales', id],
    queryFn: () => fetchAPI(`${API_BASE_URL}/sales/${id}`),
    enabled: !!id,
  });
};

export const useCreateSalesProperty = () => {
  const queryClient = useQueryClient();

  console.log('🔧 [useCreateSalesProperty] Setting up mutation');

  return useMutation({
    mutationFn: (data: CreatePropertyInput) => {
      console.log('📝 [useCreateSalesProperty] Creating sales property:', data);
      return fetchAPI(`${API_BASE_URL}/sales`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      console.log('✅ [useCreateSalesProperty] Sales property created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['properties', 'sales'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'sales-properties'] });
      toast.success('Sales property created successfully');
    },
    onError: (error: Error) => {
      console.error('❌ [useCreateSalesProperty] Failed to create sales property:', error);
      toast.error(error.message || 'Failed to create sales property');
    },
  });
};

// Property Availability
export const usePropertyAvailability = (propertyId: number, filters?: {
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();

  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);

  const url = `${API_BASE_URL}/${propertyId}/availability${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  console.log('🔧 [usePropertyAvailability] Fetching availability for property:', propertyId);
  console.log('🔧 [usePropertyAvailability] URL:', url);

  return useQuery({
    queryKey: ['properties', 'availability', propertyId, filters],
    queryFn: () => fetchAPI(url),
    enabled: !!propertyId,
  });
};

export const useUpdatePropertyAvailability = () => {
  const queryClient = useQueryClient();

  console.log('🔧 [useUpdatePropertyAvailability] Setting up mutation');

  return useMutation({
    mutationFn: ({ propertyId, data }: { propertyId: number; data: any }) => {
      console.log('📝 [useUpdatePropertyAvailability] Updating availability for property:', propertyId, data);
      return fetchAPI(`${API_BASE_URL}/${propertyId}/availability`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      console.log('✅ [useUpdatePropertyAvailability] Availability updated successfully:', data);
      queryClient.invalidateQueries({
        queryKey: ['properties', 'availability', variables.propertyId]
      });
      toast.success('Availability updated successfully');
    },
    onError: (error: Error) => {
      console.error('❌ [useUpdatePropertyAvailability] Failed to update availability:', error);
      toast.error(error.message || 'Failed to update availability');
    },
  });
};

// Dashboard & Statistics
export const usePropertyStats = (agencyId: number) => {
  console.log('🔧 [usePropertyStats] Fetching stats for agency:', agencyId);

  return useQuery({
    queryKey: ['properties', 'stats', agencyId],
    queryFn: () => fetchAPI(`${API_BASE_URL}/agency/${agencyId}/stats`),
    enabled: !!agencyId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Bulk Operations
export const useBulkUpdatePropertyStatus = () => {
  const queryClient = useQueryClient();

  console.log('🔧 [useBulkUpdatePropertyStatus] Setting up mutation');

  return useMutation({
    mutationFn: ({ propertyIds, status }: { propertyIds: number[]; status: 'draft' | 'published' | 'archived' }) => {
      console.log('📝 [useBulkUpdatePropertyStatus] Bulk updating properties:', propertyIds, status);
      return fetchAPI(`${API_BASE_URL}/bulk/status`, {
        method: 'POST',
        body: JSON.stringify({ propertyIds, status }),
      });
    },
    onSuccess: (data) => {
      console.log('✅ [useBulkUpdatePropertyStatus] Properties updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['properties', 'rental'] });
      queryClient.invalidateQueries({ queryKey: ['properties', 'sales'] });
      toast.success('Properties updated successfully');
    },
    onError: (error: Error) => {
      console.error('❌ [useBulkUpdatePropertyStatus] Failed to update properties:', error);
      toast.error(error.message || 'Failed to update properties');
    },
  });
};

// Agent Properties
export const useAgentProperties = (agentId: number) => {
  console.log('🔧 [useAgentProperties] Fetching properties for agent:', agentId);

  return useQuery({
    queryKey: ['agent', 'properties', agentId],
    queryFn: () => {
      const url = `${API_BASE_URL}/rental?agentId=${agentId}`;
      console.log('🔧 [useAgentProperties] Fetching from URL:', url);
      return fetchAPI(url);
    },
    enabled: !!agentId,
  });
};

// Custom hook for common operations
export const usePropertyManagement = (agentId: number = 1) => {
  console.log('🔧 [usePropertyManagement] Initializing for agent:', agentId);

  const queryClient = useQueryClient();

  const {
    data: propertiesData = { data: [] },
    isLoading,
    error,
  } = useRentalProperties({ agentId });

  const deleteProperty = useDeleteRentalProperty();

  const refetchProperties = () => {
    console.log('🔧 [usePropertyManagement] Refetching properties');
    queryClient.invalidateQueries({ queryKey: ['properties', 'rental'] });
  };

  if (error) {
    console.error('❌ [usePropertyManagement] Error in property management:', error);
  }

  // Extract properties from the response structure
  const properties = propertiesData.data || [];

  return {
    properties,
    isLoading,
    error,
    deleteProperty: deleteProperty.mutate,
    isDeleting: deleteProperty.isPending,
    refetchProperties,
  };
};

// Sales Properties - Update and Delete
export const useUpdateSalesProperty = () => {
  const queryClient = useQueryClient();

  console.log('🔧 [useUpdateSalesProperty] Setting up mutation');

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePropertyInput }) => {
      console.log('📝 [useUpdateSalesProperty] Updating sales property:', id, data);
      return fetchAPI(`${API_BASE_URL}/sales/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      console.log('✅ [useUpdateSalesProperty] Sales property updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['properties', 'sales'] });
      queryClient.invalidateQueries({ queryKey: ['properties', 'sales', variables.id] });
      toast.success('Sales property updated successfully');
    },
    onError: (error: Error) => {
      console.error('❌ [useUpdateSalesProperty] Failed to update sales property:', error.message);
      toast.error(error.message || 'Failed to update sales property');
    },
  });
};

export const useDeleteSalesProperty = () => {
  const queryClient = useQueryClient();

  console.log('🔧 [useDeleteSalesProperty] Setting up mutation');

  return useMutation({
    mutationFn: (id: number) => {
      console.log('📝 [useDeleteSalesProperty] Deleting sales property:', id);
      return fetchAPI(`${API_BASE_URL}/sales/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (data) => {
      console.log('✅ [useDeleteSalesProperty] Sales property deleted successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['properties', 'sales'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'sales-properties'] });
      toast.success('Sales property deleted successfully');
    },
    onError: (error: Error) => {
      console.error('❌ [useDeleteSalesProperty] Failed to delete sales property:', error);
      toast.error(error.message || 'Failed to delete sales property');
    },
  });
};

export const useUpdateSalesPropertyStatus = () => {
  const queryClient = useQueryClient();

  console.log('🔧 [useUpdateSalesPropertyStatus] Setting up mutation');

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'draft' | 'published' | 'archived' | 'sold' }) => {
      console.log('📝 [useUpdateSalesPropertyStatus] Updating sales property status:', id, status);
      return fetchAPI(`${API_BASE_URL}/sales/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (data, variables) => {
      console.log('✅ [useUpdateSalesPropertyStatus] Status updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['properties', 'sales'] });
      queryClient.invalidateQueries({ queryKey: ['properties', 'sales', variables.id] });
      toast.success('Status updated successfully');
    },
    onError: (error: Error) => {
      console.error('❌ [useUpdateSalesPropertyStatus] Failed to update status:', error);
      toast.error(error.message || 'Failed to update status');
    },
  });
};