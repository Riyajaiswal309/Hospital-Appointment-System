import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const testUsers = [
      {
        email: "patient@medibook.com",
        password: "password123",
        fullName: "John Patient",
        phone: "+1234567890",
        role: "patient",
        isApproved: true,
      },
      {
        email: "doctor@medibook.com",
        password: "password123",
        fullName: "Dr. Sarah Smith",
        phone: "+1234567891",
        role: "doctor",
        isApproved: true,
      },
      {
        email: "doctor2@medibook.com",
        password: "password123",
        fullName: "Dr. Michael Chen",
        phone: "+1234567892",
        role: "doctor",
        isApproved: true,
      },
      {
        email: "doctor3@medibook.com",
        password: "password123",
        fullName: "Dr. Emily Davis",
        phone: "+1234567893",
        role: "doctor",
        isApproved: false,
      },
      {
        email: "admin@medibook.com",
        password: "password123",
        fullName: "Admin User",
        phone: "+1234567894",
        role: "admin",
        isApproved: true,
      },
    ];

    const results: { email: string; status: string; error?: string }[] = [];

    for (const u of testUsers) {
      // Check if user already exists
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", u.email)
        .maybeSingle();

      if (existing) {
        results.push({ email: u.email, status: "already exists" });
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });

      if (authError) {
        results.push({ email: u.email, status: "auth failed", error: authError.message });
        continue;
      }

      const userId = authData.user.id;

      // Insert profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email: u.email,
        full_name: u.fullName,
        phone: u.phone,
        role: u.role,
        is_approved: u.isApproved,
      });

      if (profileError) {
        results.push({ email: u.email, status: "profile failed", error: profileError.message });
        continue;
      }

      results.push({ email: u.email, status: "created" });

      // Create doctor profiles for doctors
      if (u.role === "doctor" && u.isApproved) {
        const specs = await supabase.from("specializations").select("id, name");
        const specMap: Record<string, string> = {};
        (specs.data || []).forEach((s) => { specMap[s.name] = s.id; });

        let specId: string | null = null;
        let bio = "";
        let fee = 500;
        let exp = 5;
        let education = "";

        if (u.email === "doctor@medibook.com") {
          specId = specMap["Cardiology"] || null;
          bio = "Experienced cardiologist specializing in preventive heart care and interventional cardiology.";
          fee = 800;
          exp = 12;
          education = "MBBS, MD - Cardiology, AIIMS Delhi";
        } else if (u.email === "doctor2@medibook.com") {
          specId = specMap["Neurology"] || null;
          bio = "Neurologist with expertise in stroke management and neurodegenerative disorders.";
          fee = 1200;
          exp = 8;
          education = "MBBS, MD - Neurology, CMC Vellore";
        }

        await supabase.from("doctor_profiles").insert({
          doctor_id: userId,
          specialization_id: specId,
          bio,
          consultation_fee: fee,
          experience_years: exp,
          education,
          available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          available_time_start: "09:00",
          available_time_end: "17:00",
          rating: u.email === "doctor@medibook.com" ? 4.8 : 4.5,
          total_ratings: u.email === "doctor@medibook.com" ? 120 : 85,
        });

        // Generate slots for next 14 days
        const slots: { doctor_id: string; slot_date: string; slot_time: string }[] = [];
        const times = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
        const start = new Date();
        for (let i = 1; i <= 14; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
          if (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(dayName)) {
            const dateStr = d.toISOString().split("T")[0];
            times.forEach((t) => {
              slots.push({ doctor_id: userId, slot_date: dateStr, slot_time: t });
            });
          }
        }
        if (slots.length > 0) {
          await supabase.from("doctor_slots").upsert(slots, {
            onConflict: "doctor_id,slot_date,slot_time",
            ignoreDuplicates: true,
          });
        }
      }
    }

    // Create a sample appointment with prescription for the patient
    const { data: patient } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "patient@medibook.com")
      .maybeSingle();

    const { data: doctor } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "doctor@medibook.com")
      .maybeSingle();

    if (patient && doctor) {
      const { data: existingApt } = await supabase
        .from("appointments")
        .select("id")
        .eq("patient_id", patient.id)
        .maybeSingle();

      if (!existingApt) {
        // Completed appointment with prescription
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7);
        const pastDateStr = pastDate.toISOString().split("T")[0];

        const { data: apt } = await supabase.from("appointments").insert({
          patient_id: patient.id,
          doctor_id: doctor.id,
          appointment_date: pastDateStr,
          appointment_time: "10:00",
          status: "completed",
          reason: "Chest pain and shortness of breath",
          diagnosis: "Mild hypertension. Recommended lifestyle changes and follow-up in 2 weeks.",
        }).select().maybeSingle();

        if (apt) {
          await supabase.from("prescriptions").insert({
            appointment_id: apt.id,
            patient_id: patient.id,
            doctor_id: doctor.id,
            medications: [
              { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "30 days", instructions: "Take in the morning with food" },
              { name: "Aspirin", dosage: "75mg", frequency: "Once daily", duration: "30 days", instructions: "Take after meals" },
            ],
            notes: "Monitor blood pressure daily. Reduce salt intake. Exercise regularly.",
          });

          await supabase.from("medical_records").insert({
            appointment_id: apt.id,
            patient_id: patient.id,
            doctor_id: doctor.id,
            title: "ECG Report",
            description: "Electrocardiogram showing normal sinus rhythm with mild LVH.",
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            file_type: "document",
          });

          // Payment for the completed appointment
          await supabase.from("payments").insert({
            appointment_id: apt.id,
            patient_id: patient.id,
            doctor_id: doctor.id,
            amount: 800,
            currency: "INR",
            status: "completed",
            payment_method: "razorpay",
            razorpay_order_id: "order_seed001",
            razorpay_payment_id: "pay_seed001",
            razorpay_signature: "sig_seed001",
          });
        }

        // Upcoming confirmed appointment
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const { data: futureApt } = await supabase.from("appointments").insert({
          patient_id: patient.id,
          doctor_id: doctor.id,
          appointment_date: futureDateStr,
          appointment_time: "15:00",
          status: "confirmed",
          reason: "Follow-up consultation",
        }).select().maybeSingle();

        if (futureApt) {
          await supabase.from("payments").insert({
            appointment_id: futureApt.id,
            patient_id: patient.id,
            doctor_id: doctor.id,
            amount: 800,
            currency: "INR",
            status: "completed",
            payment_method: "razorpay",
            razorpay_order_id: "order_seed002",
            razorpay_payment_id: "pay_seed002",
            razorpay_signature: "sig_seed002",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
