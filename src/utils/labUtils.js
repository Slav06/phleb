import { supabase } from '../supabaseClient';

// Cache for lab data to avoid repeated database calls
let labsCache = null;
let testTypesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get all active labs
export const getLabs = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (!forceRefresh && labsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return labsCache;
  }

  try {
    const { data, error } = await supabase
      .from('labs')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Update cache
    labsCache = data || [];
    cacheTimestamp = now;
    
    return labsCache;
  } catch (error) {
    console.error('Error fetching labs:', error);
    return [];
  }
};

// Get all active test types
export const getTestTypes = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (!forceRefresh && testTypesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return testTypesCache;
  }

  try {
    const { data, error } = await supabase
      .from('test_types')
      .select(`
        *,
        labs (id, name, logo_url)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Update cache
    testTypesCache = data || [];
    cacheTimestamp = now;
    
    return testTypesCache;
  } catch (error) {
    console.error('Error fetching test types:', error);
    return [];
  }
};

// Get test types for a specific lab
export const getTestTypesByLab = async (labId, forceRefresh = false) => {
  const testTypes = await getTestTypes(forceRefresh);
  return testTypes.filter(test => test.lab_id === labId);
};

// Get lab by ID
export const getLabById = async (labId, forceRefresh = false) => {
  const labs = await getLabs(forceRefresh);
  return labs.find(lab => lab.id === labId);
};

// Get test type by ID
export const getTestTypeById = async (testTypeId, forceRefresh = false) => {
  const testTypes = await getTestTypes(forceRefresh);
  return testTypes.find(test => test.id === testTypeId);
};

// Clear cache (useful when data is updated)
export const clearLabCache = () => {
  labsCache = null;
  testTypesCache = null;
  cacheTimestamp = null;
};

// Get Quality Laboratory (legacy support)
export const getQualityLaboratory = async () => {
  const labs = await getLabs();
  return labs.find(lab => lab.name === 'Quality Laboratory') || labs[0];
};

// Get lab options for forms
export const getLabOptions = async () => {
  const labs = await getLabs();
  return labs.map(lab => ({
    value: lab.id,
    label: lab.name
  }));
};

// Get test type options for forms
export const getTestTypeOptions = async (labId = null) => {
  const testTypes = labId 
    ? await getTestTypesByLab(labId)
    : await getTestTypes();
    
  return testTypes.map(test => ({
    value: test.id,
    label: test.name,
    price: test.cash_price,
    tubeColor: test.tube_top_color
  }));
}; 