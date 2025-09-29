import React, { useState } from 'react';

interface ApiKeySetupProps {
  onApiKeyUpdate: (apiKey: string) => Promise<void>;
  isUpdating: boolean;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({
  onApiKeyUpdate,
  isUpdating,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid API key' });
      return;
    }

    try {
      await onApiKeyUpdate(apiKey.trim());
      setMessage({ type: 'success', text: 'API key configured successfully!' });
      setApiKey('');

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to configure API key. Please try again.',
      });

      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border-l-4 border-blue-500">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🔑</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          API Key Required
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          To display real-time cryptocurrency data, you need to configure your
          Finnhub API key.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          📋 How to get your API key:
        </h3>
        <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>
            1. Visit{' '}
            <a
              href="https://finnhub.io/register"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-blue-900 dark:hover:text-blue-200"
            >
              finnhub.io/register
            </a>
          </li>
          <li>2. Create a free account</li>
          <li>3. Copy your API key from the dashboard</li>
          <li>4. Paste it in the form below</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Finnhub API Key *
          </label>
          <input
            type="text"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Finnhub API key (e.g., c123abc456def789...)"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            disabled={isUpdating}
            required
          />
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isUpdating || !apiKey.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-lg font-medium"
        >
          {isUpdating ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Configuring API Key...
            </span>
          ) : (
            '🚀 Configure API Key & Start Dashboard'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Your API key is stored securely and only used to fetch real-time data
          from Finnhub.
        </p>
      </div>
    </div>
  );
};
