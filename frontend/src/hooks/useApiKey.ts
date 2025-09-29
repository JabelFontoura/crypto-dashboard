import { useState, useCallback } from 'react';

interface ApiKeyResponse {
  success: boolean;
  message: string;
  timestamp: number;
}

export const useApiKey = (serverUrl: string = 'http://localhost:3001') => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateApiKey = useCallback(
    async (apiKey: string): Promise<void> => {
      setIsUpdating(true);

      try {
        const response = await fetch(`${serverUrl}/api/crypto/update-api-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const data: ApiKeyResponse = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to update API key');
        }

        console.log('✅ API key updated successfully:', data.message);
      } catch (error) {
        console.error('❌ Failed to update API key:', error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [serverUrl]
  );

  return {
    updateApiKey,
    isUpdating,
  };
};
