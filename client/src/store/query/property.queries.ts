import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProperties, createProperty } from './../api/property.api';

export const useProperties = (agentId: number) =>
  useQuery({
    queryKey: ['properties', agentId],
    queryFn: () => fetchProperties(agentId),
    enabled: !!agentId,
  });

export const useCreateProperty = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};
