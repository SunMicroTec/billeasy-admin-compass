
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const SUPABASE_URL = "https://shybyigqvcbzgwmkwsrt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoeWJ5aWdxdmNiemd3bWt3c3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjIwMzIsImV4cCI6MjA2MDEzODAzMn0.ZWiSDpixi0J8mPNPzZNjPeF9ZsVgwA-QzTRl14CDQyM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
