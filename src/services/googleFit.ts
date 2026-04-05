export interface GoogleFitWeightEntry {
  date: string; // YYYY-MM-DD
  weight_kg: number;
}

const FITNESS_API_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

/**
 * Fetches weight data from Google Fit API
 * Requires scope: https://www.googleapis.com/auth/fitness.body.read
 */
export const fetchGoogleFitWeights = async (
  token: string, 
  startTimeMillis: number, 
  endTimeMillis: number
): Promise<GoogleFitWeightEntry[]> => {
  if (token === 'demo-token') {
    // Return mock data for guest mode
    return [
      { date: new Date().toISOString().split('T')[0], weight_kg: 71.5 }
    ];
  }

  const response = await fetch(`${FITNESS_API_BASE}/dataset:aggregate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aggregateBy: [{
        dataTypeName: 'com.google.weight'
      }],
      bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
      startTimeMillis,
      endTimeMillis,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Fit Read Error: ${response.statusText}`);
  }

  const data = await response.json();
  const entries: GoogleFitWeightEntry[] = [];

  // Parse the generic bucket response
  if (data.bucket) {
    data.bucket.forEach((bucket: any) => {
      if (bucket.dataset && bucket.dataset[0].point.length > 0) {
        // Get the latest point in the bucket
        const point = bucket.dataset[0].point[bucket.dataset[0].point.length - 1];
        if (point.value && point.value.length > 0) {
          const weight = point.value[0].fpVal;
          const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
          entries.push({ date, weight_kg: weight });
        }
      }
    });
  }

  return entries;
};

/**
 * Writes a weight entry to Google Fit API
 * Requires scope: https://www.googleapis.com/auth/fitness.body.write
 */
export const writeGoogleFitWeight = async (
  token: string,
  weight_kg: number,
  date: string // YYYY-MM-DD
): Promise<void> => {
  if (token === 'demo-token') return; // Do nothing for guest

  // Create a timeline timestamp for noon on the given date to ensure consistency
  const dateObj = new Date(`${date}T12:00:00Z`);
  const timeNanos = dateObj.getTime() * 1000000;

  // 1. Ensure a custom tracking Data Source exists for our app
  const dataSourceId = 'raw:com.google.weight:com.form.fitness:FormAppWeightTracker';
  
  const createSourceRes = await fetch(`${FITNESS_API_BASE}/dataSources`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dataStreamName: 'FormAppWeightTracker',
      type: 'raw',
      application: {
        name: 'Form Fitness Tracker'
      },
      dataType: {
        name: 'com.google.weight'
      }
    }),
  });
  
  // Ignore 409 Conflict if source already exists
  if (!createSourceRes.ok && createSourceRes.status !== 409) {
      console.warn('Could not create Google Fit data source, attempting write anyway...');
  }

  // 2. Patch the dataset
  const datasetId = `${timeNanos}-${timeNanos}`;
  const writeRes = await fetch(`${FITNESS_API_BASE}/dataSources/${dataSourceId}/datasets/${datasetId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dataSourceId,
      minStartTimeNs: timeNanos,
      maxEndTimeNs: timeNanos,
      point: [{
        dataTypeName: 'com.google.weight',
        startTimeNanos: timeNanos,
        endTimeNanos: timeNanos,
        value: [{ fpVal: weight_kg }]
      }]
    }),
  });

  if (!writeRes.ok) {
    throw new Error(`Google Fit Write Error: ${writeRes.statusText}`);
  }
};
