import { useState, useEffect } from 'react';
import { ServiceType } from '../types';

interface Config {
  barbershop: {
    name: string;
    phone: string;
  };
  sections: {
    schedule: {
      title: string;
      description: string;
    };
  };
  services: ServiceType[];
  footer: {
    message: string;
    subtitle: string;
    copyright: string;
  };
}

export const useConfig = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/config.json');
        if (!response.ok) {
          throw new Error('Failed to load configuration');
        }
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, loading, error };
};