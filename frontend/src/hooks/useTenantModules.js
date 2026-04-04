import { useState, useEffect } from 'react';
import { tenantAdminAPI } from '../api/client';

export const useTenantModules = () => {
  const [modules, setModules] = useState([]);
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await tenantAdminAPI.getModules();
      setModules(response.data.active_modules || []);
      setTenantName(response.data.tenant_name || '');
    } catch (err) {
      console.error('Error fetching tenant modules:', err);
      setError(err);
      // Default to food if error
      setModules(['food']);
    } finally {
      setLoading(false);
    }
  };

  const hasModule = (moduleName) => modules.includes(moduleName);

  return {
    modules,
    tenantName,
    loading,
    error,
    hasModule,
    hasFood: modules.includes('food'),
    hasGrocery: modules.includes('grocery'),
    hasLaundry: modules.includes('laundry')
  };
};
