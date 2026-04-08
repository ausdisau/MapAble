import { db } from "./db";
import { users, workers, jobs, messages, pricingTiers, participantBudgets, serviceSessions, transportTrips, reviews } from "@shared/schema";
import { sql, eq, isNull } from "drizzle-orm";

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    const existingTiers = await db.select().from(pricingTiers);
    if (existingTiers.length === 0) {
      await seedPricingAndBudgets();
    }
    await backfillVerificationData();
    return;
  }

  const seedUsers = await db.insert(users).values([
    {
      username: "alex_m",
      password: "hashed_password",
      fullName: "Alex Mehmet",
      email: "alex@mapable.com.au",
      role: "carer",
      location: "Parramatta, NSW",
      bio: "Experienced support worker with 5 years in NDIS services. Passionate about community access and transport assistance.",
      languages: ["English", "Arabic"],
      skills: ["Manual Handling", "Transport", "Community Access"],
      isVerified: true,
      phoneNumber: "0412 345 678",
    },
    {
      username: "sam_t",
      password: "hashed_password",
      fullName: "Sam Thompson",
      email: "sam@mapable.com.au",
      role: "carer",
      location: "Blacktown, NSW",
      bio: "Dedicated carer specializing in personal care and domestic assistance. Auslan proficient.",
      languages: ["English", "Auslan"],
      skills: ["Personal Care", "Domestic Assistance", "Auslan"],
      isVerified: true,
      phoneNumber: "0423 456 789",
    },
    {
      username: "sarah_j",
      password: "hashed_password",
      fullName: "Sarah Johnson",
      email: "sarah@mapable.com.au",
      role: "carer",
      location: "Bondi, NSW",
      bio: "Qualified support worker with expertise in wheelchair transport and meal preparation.",
      languages: ["English"],
      skills: ["Transport", "Meal Prep", "Personal Care"],
      isVerified: true,
      phoneNumber: "0434 567 890",
    },
    {
      username: "priya_k",
      password: "hashed_password",
      fullName: "Priya Kumar",
      email: "priya@mapable.com.au",
      role: "carer",
      location: "Parramatta, NSW",
      bio: "Cultural safety specialist with deep understanding of diverse community needs.",
      languages: ["English", "Hindi", "Tamil"],
      skills: ["Cultural Safety", "Community Access", "Social Support"],
      isVerified: true,
      phoneNumber: "0445 678 901",
    },
    {
      username: "liam_w",
      password: "hashed_password",
      fullName: "Liam Wilson",
      email: "liam@mapable.com.au",
      role: "carer",
      location: "Liverpool, NSW",
      bio: "Sports and recreation support worker. Helping participants stay active and engaged.",
      languages: ["English"],
      skills: ["Recreation", "Exercise Physiology", "Community Access"],
      isVerified: true,
      phoneNumber: "0456 789 012",
    },
    {
      username: "demo_participant",
      password: "hashed_password",
      fullName: "Jordan Lee",
      email: "jordan@example.com",
      role: "participant",
      location: "Sydney, NSW",
      accessNeeds: ["Wheelchair Accessible", "Low Sensory Environment"],
      ndisNumber: "430 123 456",
      planStartDate: "2025-07-01",
      planEndDate: "2026-06-30",
      phoneNumber: "0467 890 123",
    },
    {
      username: "ndis_provider",
      password: "hashed_password",
      fullName: "MapAble Services",
      email: "services@mapable.com.au",
      role: "provider",
      location: "Sydney, NSW",
      abn: "51 824 753 556",
    },
  ]).returning();

  const carerIds = seedUsers.filter(u => u.role === "carer");

  await db.insert(workers).values([
    {
      userId: carerIds[0].id,
      title: "Senior Support Worker & Transport Driver",
      specializations: ["Manual Handling", "Community Access", "Transport", "Personal Care"],
      hourlyRate: "55.00",
      transportCapable: true,
      transportType: "Car, Wheelchair Accessible",
      wheelchairAccessible: true,
      ndisVerified: true,
      rating: "4.80",
      reviewCount: 47,
      availability: "Mon-Fri, 7am-6pm",
      abn: "12 345 678 901",
      insuranceExpiry: "2027-03-15",
      firstAidExpiry: "2027-06-20",
      wwccNumber: "WWC1234567E",
      wwccExpiry: "2028-01-10",
    },
    {
      userId: carerIds[1].id,
      title: "Personal Care & Auslan Interpreter",
      specializations: ["Personal Care", "Auslan", "Domestic Assistance", "Meal Prep"],
      hourlyRate: "52.00",
      transportCapable: true,
      transportType: "Car",
      wheelchairAccessible: false,
      ndisVerified: true,
      rating: "4.90",
      reviewCount: 62,
      availability: "Mon-Sat, 8am-8pm",
      abn: "23 456 789 012",
      insuranceExpiry: "2027-05-01",
      firstAidExpiry: "2027-09-15",
      wwccNumber: "WWC2345678E",
      wwccExpiry: "2027-11-20",
    },
    {
      userId: carerIds[2].id,
      title: "Transport & Domestic Support Worker",
      specializations: ["Transport", "Meal Prep", "Personal Care", "Shopping Assistance"],
      hourlyRate: "50.00",
      transportCapable: true,
      transportType: "Car, Wheelchair Accessible",
      wheelchairAccessible: true,
      ndisVerified: true,
      rating: "4.70",
      reviewCount: 35,
      availability: "Tue-Sun, 6am-4pm",
      abn: "34 567 890 123",
      insuranceExpiry: "2027-02-28",
      firstAidExpiry: "2027-04-10",
      wwccNumber: "WWC3456789E",
      wwccExpiry: "2028-03-15",
    },
    {
      userId: carerIds[3].id,
      title: "Cultural Safety & Community Worker",
      specializations: ["Cultural Safety", "Community Access", "Social Support", "Advocacy"],
      hourlyRate: "48.00",
      transportCapable: false,
      wheelchairAccessible: false,
      ndisVerified: true,
      rating: "4.95",
      reviewCount: 78,
      availability: "Mon-Fri, 9am-5pm",
      abn: "45 678 901 234",
      insuranceExpiry: "2027-08-20",
      firstAidExpiry: "2028-01-05",
      wwccNumber: "WWC4567890E",
      wwccExpiry: "2027-09-30",
    },
    {
      userId: carerIds[4].id,
      title: "Recreation & Active Support Worker",
      specializations: ["Recreation", "Exercise Physiology", "Community Access", "Group Activities"],
      hourlyRate: "53.00",
      transportCapable: true,
      transportType: "Car",
      wheelchairAccessible: false,
      ndisVerified: true,
      rating: "4.85",
      reviewCount: 41,
      availability: "Mon-Sun, flexible",
      abn: "56 789 012 345",
      insuranceExpiry: "2027-07-10",
      firstAidExpiry: "2027-12-01",
      wwccNumber: "WWC5678901E",
      wwccExpiry: "2028-06-15",
    },
  ]);

  await db.insert(jobs).values([
    {
      postedBy: seedUsers.find(u => u.role === "provider")!.id,
      title: "Support Worker - Personal Care",
      description: "Seeking compassionate support workers for personal care services across Western Sydney. Must have NDIS Worker Screening clearance and experience with manual handling.",
      location: "Western Sydney, NSW",
      jobType: "Part-time",
      salary: "$32-$38/hr",
      requirements: ["NDIS Worker Screening", "First Aid Certificate", "Manual Handling"],
      category: "Care",
      status: "open",
    },
    {
      postedBy: seedUsers.find(u => u.role === "provider")!.id,
      title: "Transport Driver - NDIS Participants",
      description: "Looking for reliable drivers to provide transport services for NDIS participants. Wheelchair accessible vehicle is a plus. Flexible hours available.",
      location: "Sydney Metro, NSW",
      jobType: "Casual",
      salary: "$35-$42/hr",
      requirements: ["Driver Licence", "NDIS Worker Screening", "Working with Children Check"],
      category: "Transport",
      status: "open",
    },
    {
      postedBy: seedUsers.find(u => u.role === "provider")!.id,
      title: "Community Access Coordinator",
      description: "Full-time role coordinating community access programs for NDIS participants. You will plan and deliver inclusive activities and build community partnerships.",
      location: "Parramatta, NSW",
      jobType: "Full-time",
      salary: "$65,000 - $75,000",
      requirements: ["Certificate IV in Disability", "NDIS Experience", "Driver Licence"],
      category: "Support",
      status: "open",
    },
    {
      postedBy: seedUsers.find(u => u.role === "provider")!.id,
      title: "Auslan Interpreter - Support Services",
      description: "Seeking qualified Auslan interpreters to support Deaf and hard of hearing NDIS participants in appointments, community activities, and daily living tasks.",
      location: "Sydney CBD, NSW",
      jobType: "Contract",
      salary: "$45-$55/hr",
      requirements: ["NAATI Accredited", "NDIS Worker Screening", "Auslan Proficiency"],
      category: "Care",
      status: "open",
    },
    {
      postedBy: seedUsers.find(u => u.role === "provider")!.id,
      title: "Disability Employment Consultant",
      description: "Join our team helping NDIS participants find meaningful employment. You will provide career coaching, workplace modifications advice, and employer engagement.",
      location: "Sydney, NSW",
      jobType: "Full-time",
      salary: "$70,000 - $85,000",
      requirements: ["Employment Services Experience", "NDIS Knowledge", "Cert IV in Employment Services"],
      category: "Employment",
      status: "open",
    },
  ]);

  await db.insert(messages).values([
    {
      senderId: carerIds[0].id,
      receiverId: seedUsers.find(u => u.role === "participant")!.id,
      body: "Hi Jordan! I am available for your transport request on Thursday. I have a wheelchair accessible vehicle. Let me know if you would like to confirm.",
    },
    {
      senderId: seedUsers.find(u => u.role === "participant")!.id,
      receiverId: carerIds[0].id,
      body: "That sounds great Alex! Can we schedule for 10am pickup from Parramatta station?",
    },
    {
      senderId: carerIds[1].id,
      receiverId: seedUsers.find(u => u.role === "participant")!.id,
      body: "Hi! I saw you were looking for a support worker who knows Auslan. I am NAATI certified and available on weekdays. Would you like to chat about your needs?",
    },
  ]);

  await seedPricingAndBudgets();

  console.log("Database seeded successfully");
}

async function seedPricingAndBudgets() {
  await db.insert(pricingTiers).values([
    {
      serviceType: "care",
      tierName: "Basic Care",
      minUsage: "1",
      maxUsage: "10",
      rate: "70.23",
      ndisCategory: "Core Supports - Assistance with Daily Life",
      ndisItemCode: "01_011_0107_1_1",
      description: "Standard weekday rate for personal care and daily living assistance",
    },
    {
      serviceType: "care",
      tierName: "Standard Care",
      minUsage: "11",
      maxUsage: "30",
      rate: "68.00",
      ndisCategory: "Core Supports - Assistance with Daily Life",
      ndisItemCode: "01_011_0107_1_1",
      description: "3% volume discount for moderate usage, below NDIS price cap",
    },
    {
      serviceType: "care",
      tierName: "High Support",
      minUsage: "31",
      rate: "65.00",
      ndisCategory: "Core Supports - Assistance with Daily Life",
      ndisItemCode: "01_011_0107_1_1",
      description: "Volume rate for high needs usage, ensuring sustainability within NDIS funding",
    },
    {
      serviceType: "care",
      tierName: "Support Coordination",
      minUsage: "0",
      rate: "100.14",
      ndisCategory: "Capacity Building - Coordination of Supports",
      ndisItemCode: "07_002_0106_8_3",
      description: "Level 2 Coordination of Supports, billed only when care planning support is provided",
    },
    {
      serviceType: "transport",
      tierName: "Basic Mobility",
      minUsage: "1",
      maxUsage: "100",
      rate: "0.99",
      ndisCategory: "Core Supports - Transport",
      ndisItemCode: "02_051_0108_1_1",
      description: "Standard provider-owned vehicle rate matching NDIS cap",
    },
    {
      serviceType: "transport",
      tierName: "Standard Mobility",
      minUsage: "101",
      maxUsage: "300",
      rate: "0.90",
      ndisCategory: "Core Supports - Transport",
      ndisItemCode: "02_051_0108_1_1",
      description: "10% volume discount for moderate transport usage",
    },
    {
      serviceType: "transport",
      tierName: "High Mobility",
      minUsage: "301",
      rate: "0.85",
      ndisCategory: "Core Supports - Transport",
      ndisItemCode: "02_051_0108_1_1",
      description: "Bulk rate for very high transport needs",
    },
    {
      serviceType: "transport",
      tierName: "Accessible Vehicle",
      minUsage: "0",
      rate: "2.76",
      ndisCategory: "Core Supports - Transport (Modified Vehicle)",
      ndisItemCode: "02_051_0108_1_1",
      description: "NDIS rate for modified/wheelchair-accessible vehicles, applied per-trip",
    },
  ]);

  const participant = await db.select().from(users).where(sql`${users.role} = 'participant'`);
  if (participant.length > 0) {
    const pid = participant[0].id;

    await db.insert(participantBudgets).values([
      {
        participantId: pid,
        category: "daily_living",
        totalAllocated: "28000.00",
        totalUsed: "8450.00",
        periodStart: "2025-07-01",
        periodEnd: "2026-06-30",
      },
      {
        participantId: pid,
        category: "transport",
        totalAllocated: "3456.00",
        totalUsed: "892.50",
        periodStart: "2025-07-01",
        periodEnd: "2026-06-30",
      },
      {
        participantId: pid,
        category: "capacity_building",
        totalAllocated: "12000.00",
        totalUsed: "3200.00",
        periodStart: "2025-07-01",
        periodEnd: "2026-06-30",
      },
    ]);

    const allWorkers = await db.select().from(workers);
    if (allWorkers.length > 0) {
      await db.insert(serviceSessions).values([
        {
          workerId: allWorkers[0].id,
          participantId: pid,
          startTime: "09:00",
          endTime: "13:00",
          actualHours: "4.00",
          hourlyRate: "70.23",
          tierApplied: "Basic Care",
          ndisItemCode: "01_011_0107_1_1",
          totalCharge: "280.92",
          shiftNotes: "Community access outing to Parramatta Park. Participant engaged well with activities.",
          status: "completed",
          date: "2026-02-20",
        },
        {
          workerId: allWorkers[1].id,
          participantId: pid,
          startTime: "14:00",
          endTime: "17:00",
          actualHours: "3.00",
          hourlyRate: "70.23",
          tierApplied: "Basic Care",
          ndisItemCode: "01_011_0107_1_1",
          totalCharge: "210.69",
          shiftNotes: "Personal care assistance and meal preparation. Worked on daily living skills.",
          status: "completed",
          date: "2026-02-22",
        },
        {
          workerId: allWorkers[0].id,
          participantId: pid,
          startTime: "08:00",
          endTime: "14:00",
          actualHours: "6.00",
          hourlyRate: "68.00",
          tierApplied: "Standard Care",
          ndisItemCode: "01_011_0107_1_1",
          totalCharge: "408.00",
          shiftNotes: "Full morning support including transport to medical appointment and community access.",
          status: "completed",
          date: "2026-03-01",
        },
      ]);

      await db.insert(transportTrips).values([
        {
          workerId: allWorkers[0].id,
          participantId: pid,
          distanceKm: "25.5",
          perKmRate: "0.99",
          tierApplied: "Basic Mobility",
          accessibleVehicle: true,
          accessibleSurcharge: "0",
          tolls: "6.50",
          totalCharge: "31.75",
          ndisItemCode: "02_051_0108_1_1",
          status: "completed",
          date: "2026-02-20",
        },
        {
          workerId: allWorkers[2].id,
          participantId: pid,
          distanceKm: "42.0",
          perKmRate: "0.99",
          tierApplied: "Basic Mobility",
          accessibleVehicle: true,
          accessibleSurcharge: "0",
          tolls: "0",
          totalCharge: "41.58",
          ndisItemCode: "02_051_0108_1_1",
          status: "completed",
          date: "2026-03-05",
        },
      ]);

      await db.insert(reviews).values([
        {
          participantId: pid,
          workerId: allWorkers[0].id,
          rating: 5,
          comment: "Alex is absolutely wonderful. Always on time, great with communication, and makes me feel comfortable and safe during transport.",
          createdAt: new Date("2026-02-21"),
        },
        {
          participantId: pid,
          workerId: allWorkers[1].id,
          rating: 5,
          comment: "Sam is incredibly patient and skilled with Auslan. The personal care support has been life-changing.",
          createdAt: new Date("2026-02-23"),
        },
        {
          participantId: pid,
          workerId: allWorkers[0].id,
          rating: 4,
          comment: "Good session overall, slight delay due to traffic but communicated well throughout.",
          createdAt: new Date("2026-03-02"),
        },
      ]);
    }
  }

  console.log("Pricing tiers, budgets, and sample data seeded");
}

async function backfillVerificationData() {
  const verificationData = [
    { username: "alex_m", abn: "12 345 678 901", insuranceExpiry: "2027-03-15", firstAidExpiry: "2027-06-20", wwccNumber: "WWC1234567E", wwccExpiry: "2028-01-10", phoneNumber: "0412 345 678" },
    { username: "sam_t", abn: "23 456 789 012", insuranceExpiry: "2027-05-01", firstAidExpiry: "2027-09-15", wwccNumber: "WWC2345678E", wwccExpiry: "2027-11-20", phoneNumber: "0423 456 789" },
    { username: "sarah_j", abn: "34 567 890 123", insuranceExpiry: "2027-02-28", firstAidExpiry: "2027-04-10", wwccNumber: "WWC3456789E", wwccExpiry: "2028-03-15", phoneNumber: "0434 567 890" },
    { username: "priya_k", abn: "45 678 901 234", insuranceExpiry: "2027-08-20", firstAidExpiry: "2028-01-05", wwccNumber: "WWC4567890E", wwccExpiry: "2027-09-30", phoneNumber: "0445 678 901" },
    { username: "liam_w", abn: "56 789 012 345", insuranceExpiry: "2027-07-10", firstAidExpiry: "2027-12-01", wwccNumber: "WWC5678901E", wwccExpiry: "2028-06-15", phoneNumber: "0456 789 012" },
  ];

  for (const data of verificationData) {
    const [user] = await db.select().from(users).where(eq(users.username, data.username));
    if (!user) continue;

    if (!user.phoneNumber) {
      await db.update(users).set({ phoneNumber: data.phoneNumber }).where(eq(users.id, user.id));
    }

    const workerRows = await db.select().from(workers).where(eq(workers.userId, user.id));
    for (const w of workerRows) {
      if (!w.abn) {
        await db.update(workers).set({
          abn: data.abn,
          insuranceExpiry: data.insuranceExpiry,
          firstAidExpiry: data.firstAidExpiry,
          wwccNumber: data.wwccNumber,
          wwccExpiry: data.wwccExpiry,
        }).where(eq(workers.id, w.id));
      }
    }
  }

  const participant = await db.select().from(users).where(eq(users.username, "demo_participant"));
  if (participant.length > 0 && !participant[0].ndisNumber) {
    await db.update(users).set({
      ndisNumber: "430 123 456",
      planStartDate: "2025-07-01",
      planEndDate: "2026-06-30",
      phoneNumber: "0467 890 123",
    }).where(eq(users.id, participant[0].id));
  }

  console.log("Verification data backfilled");
}
