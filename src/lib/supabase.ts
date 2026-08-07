import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase (publishable key — aman untuk dipakai di client,
// sama persis seperti versi Next.js)
const supabaseUrl = 'https://fogkgkqnxpzedmtclhil.supabase.co';
const supabaseKey = 'sb_publishable_0iQBBuVFUdVLHgMSe6Y_0g_F_rGHFcv';

export const supabase = createClient(supabaseUrl, supabaseKey);
