import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
);

async function test() {
  console.log("Fetching profiles without auth...");
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  if (error) {
    console.error("Supabase Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success:", data);
  }
}

test();
