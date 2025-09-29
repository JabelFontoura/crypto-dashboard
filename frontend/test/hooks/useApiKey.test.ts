import { renderHook, act } from '@testing-library/react';
import { useApiKey } from '../../src/hooks/useApiKey';

global.fetch = jest.fn();

describe('useApiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useApiKey());

    expect(result.current.isUpdating).toBe(false);
    expect(typeof result.current.updateApiKey).toBe('function');
  });

  it('should update API key successfully', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'API key updated successfully',
      }),
    } as Response);

    const { result } = renderHook(() => useApiKey());

    await act(async () => {
      await result.current.updateApiKey('test-api-key');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/crypto/update-api-key',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: 'test-api-key' }),
      }
    );
  });

  it('should set isUpdating to true during API call', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(promise as Promise<Response>);

    const { result } = renderHook(() => useApiKey());

    act(() => {
      result.current.updateApiKey('test-api-key');
    });

    expect(result.current.isUpdating).toBe(true);

    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => ({ success: true }),
      });
      await promise;
    });

    expect(result.current.isUpdating).toBe(false);
  });

  it('should handle API error response', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        message: 'Invalid API key',
      }),
    } as Response);

    const { result } = renderHook(() => useApiKey());

    await act(async () => {
      await expect(result.current.updateApiKey('invalid-key')).rejects.toThrow(
        'Failed to update API key'
      );
    });

    expect(result.current.isUpdating).toBe(false);
  });

  it('should handle network error', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useApiKey());

    await act(async () => {
      await expect(result.current.updateApiKey('test-api-key')).rejects.toThrow(
        'Failed to update API key'
      );
    });

    expect(result.current.isUpdating).toBe(false);
  });

  it('should handle empty API key', async () => {
    const { result } = renderHook(() => useApiKey());

    await act(async () => {
      await expect(result.current.updateApiKey('')).rejects.toThrow(
        'API key cannot be empty'
      );
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.isUpdating).toBe(false);
  });

  it('should handle whitespace-only API key', async () => {
    const { result } = renderHook(() => useApiKey());

    await act(async () => {
      await expect(result.current.updateApiKey('   ')).rejects.toThrow(
        'API key cannot be empty'
      );
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.isUpdating).toBe(false);
  });

  it('should trim API key before sending', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useApiKey());

    await act(async () => {
      await result.current.updateApiKey('  test-api-key  ');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ apiKey: 'test-api-key' }),
      })
    );
  });
});
