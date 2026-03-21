import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.error('See frontend/env.example for the format');
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  console.error('Expected format: https://your-project-ref.supabase.co');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Test Supabase connection - useful for debugging
 */
export async function testSupabaseConnection() {
  const results = {
    url: supabaseUrl,
    urlResolvable: false,
    apiReachable: false,
    authEndpointReachable: false,
    error: null,
    details: [],
  };

  if (!supabaseUrl) {
    results.error = 'Supabase URL not configured';
    return results;
  }

  if (!supabaseAnonKey) {
    results.error = 'Supabase anon key not configured';
    return results;
  }

  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    // Test 1: Try auth health endpoint (most reliable test)
    try {
      const authUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`;
      const authResponse = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
        },
      });
      
      if (authResponse.ok || authResponse.status === 401) {
        // 401 is fine - means endpoint exists and is responding
        results.urlResolvable = true;
        results.apiReachable = true;
        results.authEndpointReachable = true;
        results.details.push('✅ Auth endpoint is reachable');
      } else {
        results.details.push(`⚠️ Auth endpoint returned status: ${authResponse.status}`);
      }
    } catch (err) {
      const errorMsg = err.message || String(err);
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('ERR_NAME_NOT_RESOLVED') || errorMsg.includes('NetworkError')) {
        results.error = 'DNS resolution failed - Supabase project might be paused or URL is incorrect';
        results.details.push('❌ Cannot resolve Supabase domain');
        return results;
      }
      results.details.push(`⚠️ Auth endpoint test error: ${errorMsg}`);
    }

    // Test 2: Try Supabase client call
    try {
      const { error } = await supabase.auth.getSession();
      // Even if there's no session, if we get here without network error, connection works
      if (!error || error.message.includes('session')) {
        results.apiReachable = true;
        results.authEndpointReachable = true;
        results.details.push('✅ Supabase client can connect');
      } else {
        results.details.push(`⚠️ Supabase client error: ${error.message}`);
      }
    } catch (err) {
      const errorMsg = err.message || String(err);
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('ERR_NAME_NOT_RESOLVED')) {
        if (!results.error) {
          results.error = 'Supabase client cannot connect. Check if project is paused in Supabase dashboard.';
        }
        results.details.push('❌ Supabase client connection failed');
      } else {
        results.details.push(`⚠️ Unexpected error: ${errorMsg}`);
      }
    }

    return results;
  } catch (err) {
    results.error = err.message || String(err);
    return results;
  }
}

// Make test function available globally in development for browser console
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.testSupabaseConnection = testSupabaseConnection;
  console.log('💡 Tip: Run testSupabaseConnection() in console to test connection');
}

/**
 * Retry connection test with exponential backoff - useful after resuming project
 */
export async function testSupabaseConnectionWithRetry(maxRetries = 3, delayMs = 2000) {
  console.log(`🔄 Testing connection with ${maxRetries} retries (${delayMs}ms delay)...`);
  
  for (let i = 0; i < maxRetries; i++) {
    const results = await testSupabaseConnection();
    
    if (!results.error) {
      console.log(`✅ Connection successful on attempt ${i + 1}`);
      return results;
    }
    
    if (i < maxRetries - 1) {
      console.log(`⏳ Attempt ${i + 1} failed. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  
  const finalResults = await testSupabaseConnection();
  console.log('❌ All retry attempts failed');
  return finalResults;
}

// Make retry function available globally in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.testSupabaseConnectionWithRetry = testSupabaseConnectionWithRetry;
}

// Auto-test on module load in development
if (import.meta.env.DEV && supabaseUrl) {
  testSupabaseConnection().then(results => {
    if (results.error) {
      console.error('❌ Supabase Connection Test Failed:', results.error);
      console.log('📋 Quick Checklist:');
      console.log('  1. Verify project exists at:', supabaseUrl);
      console.log('  2. Check if project is PAUSED → Resume if needed');
      console.log('  3. ⚠️ If just resumed: Wait 2-5 min + Clear DNS cache');
      console.log('     Windows: ipconfig /flushdns (run as Admin)');
      console.log('     macOS: sudo dscacheutil -flushcache');
      console.log('  4. Clear browser cache (DevTools → Application → Clear storage)');
      console.log('  5. Restart browser completely');
      console.log('  6. Verify URL in Dashboard → Settings → API');
      console.log('  7. Restart dev server after updating .env');
      console.log('  8. Run: testSupabaseConnection() in console');
      console.log('  9. Run: testSupabaseConnectionWithRetry() to retry with delays');
      console.log('📖 Full guide: docs/SUPABASE-CONNECTION-TROUBLESHOOTING.md');
    } else {
      console.log('✅ Supabase connection test passed');
      if (results.details.length > 0) {
        results.details.forEach(detail => console.log('  ', detail));
      }
    }
  }).catch(() => {
    // Silent fail in auto-test
  });
}
