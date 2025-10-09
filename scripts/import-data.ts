import { db } from "../server/db";
import { readFileSync } from "fs";
import { join } from "path";
import {
  agencies,
  agents,
  agencyAgents,
  properties,
  clients,
  reviews,
  inquiries,
  appointments,
  agentEvents,
  conversationMessages,
  pinnedConversations,
  neighborhoodRatings,
  fraudReports,
  clientFavoriteProperties,
  clientFavoriteAgents,
  clientFavoriteAgencies,
  agentFavoriteProperties,
  propertyVisitRequests,
} from "../shared/schema";

// Helper function to load JSON file
function loadJson(filename: string): any[] {
  const filePath = join(process.cwd(), "data", "import", filename);
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

// Helper function to transform date strings to Date objects
function transformDates(obj: any, dateFields: string[]): any {
  const result = { ...obj };
  for (const field of dateFields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field]);
    }
  }
  return result;
}

async function importData() {
  console.log("Starting database import...");

  try {
    // 1. Import agencies
    console.log("\n1. Importing agencies...");
    const agenciesData = loadJson("agencies_1760024780071.json");
    for (const agency of agenciesData) {
      const transformed = transformDates(agency, ["created_at"]);
      await db.insert(agencies).values({
        id: transformed.id,
        agencyName: transformed.agency_name,
        agencyAddress: transformed.agency_address,
        agencyDescription: transformed.agency_description,
        agencyLogo: transformed.agency_logo,
        agencyEmailToDisplay: transformed.agency_email_to_display,
        agencyPhone: transformed.agency_phone,
        agencyActiveSince: transformed.agency_active_since,
        city: transformed.city || 'Barcelona',
        agencyInfluenceNeighborhoods: transformed.agency_influence_neighborhoods,
        agencySupportedLanguages: transformed.agency_supported_languages,
        adminAgentId: transformed.admin_agent_id,
        agencyWebsite: transformed.agency_website,
        agencySocialMedia: transformed.agency_social_media,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${agenciesData.length} agencies`);

    // 2. Import agents
    console.log("\n2. Importing agents...");
    const agentsData = loadJson("agents_1760024780071.json");
    for (const agent of agentsData) {
      const transformed = transformDates(agent, ["created_at"]);
      await db.insert(agents).values({
        id: transformed.id,
        email: transformed.email,
        password: transformed.password,
        name: transformed.name,
        surname: transformed.surname,
        description: transformed.description,
        avatar: transformed.avatar,
        createdAt: transformed.created_at || new Date(),
        city: transformed.city || 'Barcelona',
        influenceNeighborhoods: transformed.influence_neighborhoods,
        yearsOfExperience: transformed.years_of_experience,
        languagesSpoken: transformed.languages_spoken,
        agencyId: transformed.agency_id,
        isAdmin: transformed.is_admin || false,
        subscriptionPlan: transformed.subscription_plan,
        subscriptionType: transformed.subscription_type,
        isYearlyBilling: transformed.is_yearly_billing || false,
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${agentsData.length} agents`);

    // 3. Import agency_agents (if any)
    console.log("\n3. Importing agency agents...");
    const agencyAgentsData = loadJson("agency_agents_1760024780061.json");
    if (agencyAgentsData.length > 0) {
      for (const agencyAgent of agencyAgentsData) {
        const transformed = transformDates(agencyAgent, ["created_at"]);
        await db.insert(agencyAgents).values({
          id: transformed.id,
          agencyId: transformed.agency_id,
          agentName: transformed.agent_name,
          agentSurname: transformed.agent_surname,
          agentEmail: transformed.agent_email,
          createdAt: transformed.created_at || new Date(),
        }).onConflictDoNothing();
      }
      console.log(`✓ Imported ${agencyAgentsData.length} agency agents`);
    } else {
      console.log(`✓ No agency agents to import`);
    }

    // 4. Import properties
    console.log("\n4. Importing properties...");
    const propertiesData = loadJson("properties_1760024780063.json");
    for (const property of propertiesData) {
      const transformed = transformDates(property, ["created_at", "availability_date"]);
      await db.insert(properties).values({
        id: transformed.id,
        reference: transformed.reference,
        address: transformed.address,
        escalera: transformed.escalera,
        planta: transformed.planta,
        puerta: transformed.puerta,
        type: transformed.type,
        operationType: transformed.operation_type,
        housingType: transformed.housing_type,
        housingStatus: transformed.housing_status,
        floor: transformed.floor,
        features: transformed.features,
        availability: transformed.availability,
        availabilityDate: transformed.availability_date,
        previousPrice: transformed.previous_price,
        description: transformed.description,
        price: transformed.price,
        city: transformed.city || 'Barcelona',
        district: transformed.district,
        neighborhood: transformed.neighborhood,
        bedrooms: transformed.bedrooms,
        bathrooms: transformed.bathrooms,
        superficie: transformed.superficie,
        images: transformed.images,
        imageUrls: transformed.image_urls,
        mainImageIndex: transformed.main_image_index || 0,
        title: transformed.title,
        viewCount: transformed.view_count || 0,
        agentId: transformed.agent_id,
        agencyId: transformed.agency_id,
        isActive: transformed.is_active !== undefined ? transformed.is_active : true,
        fraudCount: transformed.fraud_count || 0,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${propertiesData.length} properties`);

    // 5. Import clients
    console.log("\n5. Importing clients...");
    const clientsData = loadJson("clients_1760024780067.json");
    for (const client of clientsData) {
      const transformed = transformDates(client, ["created_at", "move_in_date"]);
      await db.insert(clients).values({
        id: transformed.id,
        name: transformed.name,
        surname: transformed.surname,
        email: transformed.email,
        phone: transformed.phone,
        password: transformed.password,
        propertyInterest: transformed.property_interest,
        budget: transformed.budget,
        notes: transformed.notes,
        agentId: transformed.agent_id,
        createdAt: transformed.created_at || new Date(),
        avatar: transformed.avatar,
        employmentStatus: transformed.employment_status,
        position: transformed.position,
        yearsAtPosition: transformed.years_at_position,
        monthlyIncome: transformed.monthly_income,
        numberOfPeople: transformed.number_of_people,
        relationship: transformed.relationship,
        hasMinors: transformed.has_minors || false,
        hasAdolescents: transformed.has_adolescents || false,
        petsStatus: transformed.pets_status,
        petsDescription: transformed.pets_description,
        moveInTiming: transformed.move_in_timing,
        moveInDate: transformed.move_in_date,
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${clientsData.length} clients`);

    // 6. Import reviews
    console.log("\n6. Importing reviews...");
    const reviewsData = loadJson("reviews_1760024780064.json");
    for (const review of reviewsData) {
      const transformed = transformDates(review, ["date", "response_date"]);
      await db.insert(reviews).values({
        id: transformed.id,
        targetId: transformed.target_id,
        targetType: transformed.target_type,
        propertyId: transformed.property_id,
        verified: transformed.verified || false,
        pinned: transformed.pinned || false,
        comment: transformed.comment,
        agentResponse: transformed.agent_response,
        responseDate: transformed.response_date,
        areaKnowledge: transformed.area_knowledge?.toString(),
        priceNegotiation: transformed.price_negotiation?.toString(),
        treatment: transformed.treatment?.toString(),
        punctuality: transformed.punctuality?.toString(),
        propertyKnowledge: transformed.property_knowledge?.toString(),
        rating: transformed.rating?.toString(),
        author: transformed.author,
        date: transformed.date || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${reviewsData.length} reviews`);

    // 7. Import inquiries
    console.log("\n7. Importing inquiries...");
    const inquiriesData = loadJson("inquiries_1760024780066.json");
    for (const inquiry of inquiriesData) {
      const transformed = transformDates(inquiry, ["created_at"]);
      await db.insert(inquiries).values({
        id: transformed.id,
        name: transformed.name,
        email: transformed.email,
        phone: transformed.phone,
        message: transformed.message,
        propertyId: transformed.property_id,
        agentId: transformed.agent_id,
        status: transformed.status || "pendiente",
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${inquiriesData.length} inquiries`);

    // 8. Import appointments
    console.log("\n8. Importing appointments...");
    const appointmentsData = loadJson("appointments_1760024780069.json");
    for (const appointment of appointmentsData) {
      const transformed = transformDates(appointment, ["date", "created_at"]);
      await db.insert(appointments).values({
        id: transformed.id,
        clientId: transformed.client_id,
        agentId: transformed.agent_id,
        type: transformed.type,
        date: transformed.date,
        time: transformed.time,
        propertyId: transformed.property_id,
        comments: transformed.comments,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${appointmentsData.length} appointments`);

    // 9. Import agent events
    console.log("\n9. Importing agent events...");
    const agentEventsData = loadJson("agent_events_1760024780069.json");
    for (const event of agentEventsData) {
      const transformed = transformDates(event, ["created_at"]);
      await db.insert(agentEvents).values({
        id: transformed.id,
        agentId: transformed.agent_id,
        clientId: transformed.client_id,
        propertyId: transformed.property_id,
        eventType: transformed.event_type,
        eventDate: transformed.event_date,
        eventTime: transformed.event_time,
        comments: transformed.comments,
        status: transformed.status || "scheduled",
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${agentEventsData.length} agent events`);

    // 10. Import conversation messages
    console.log("\n10. Importing conversation messages...");
    const messagesData = loadJson("conversation_messages_1760024780067.json");
    for (const message of messagesData) {
      const transformed = transformDates(message, ["created_at"]);
      await db.insert(conversationMessages).values({
        id: transformed.id,
        inquiryId: transformed.inquiry_id,
        senderType: transformed.sender_type,
        senderId: transformed.sender_id,
        senderName: transformed.sender_name,
        content: transformed.content,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${messagesData.length} conversation messages`);

    // 11. Import pinned conversations
    console.log("\n11. Importing pinned conversations...");
    const pinnedData = loadJson("pinned_conversations_1760024780065.json");
    for (const pinned of pinnedData) {
      const transformed = transformDates(pinned, ["created_at"]);
      await db.insert(pinnedConversations).values({
        id: transformed.id,
        userType: transformed.user_type,
        userId: transformed.user_id,
        userEmail: transformed.user_email,
        inquiryId: transformed.inquiry_id,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${pinnedData.length} pinned conversations`);

    // 12. Import neighborhood ratings
    console.log("\n12. Importing neighborhood ratings...");
    const ratingsData = loadJson("neighborhood_ratings_1760024780065.json");
    for (const rating of ratingsData) {
      const transformed = transformDates(rating, ["created_at"]);
      await db.insert(neighborhoodRatings).values({
        id: transformed.id,
        city: transformed.city || 'Barcelona',
        district: transformed.district,
        neighborhood: transformed.neighborhood,
        security: transformed.security?.toString(),
        parking: transformed.parking?.toString(),
        familyFriendly: transformed.family_friendly?.toString(),
        publicTransport: transformed.public_transport?.toString(),
        greenSpaces: transformed.green_spaces?.toString(),
        services: transformed.services?.toString(),
        userId: transformed.user_id,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${ratingsData.length} neighborhood ratings`);

    // 13. Import fraud reports
    console.log("\n13. Importing fraud reports...");
    const fraudData = loadJson("fraud_reports_1760024780066.json");
    for (const fraud of fraudData) {
      const transformed = transformDates(fraud, ["created_at"]);
      await db.insert(fraudReports).values({
        id: transformed.id,
        propertyId: transformed.property_id,
        reporterIp: transformed.reporter_ip,
        reporterAgent: transformed.reporter_agent,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${fraudData.length} fraud reports`);

    // 14. Import client favorite properties
    console.log("\n14. Importing client favorite properties...");
    const clientFavPropsData = loadJson("client_favorite_properties_1760024780068.json");
    for (const fav of clientFavPropsData) {
      const transformed = transformDates(fav, ["created_at"]);
      await db.insert(clientFavoriteProperties).values({
        id: transformed.id,
        clientId: transformed.client_id,
        propertyId: transformed.property_id,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${clientFavPropsData.length} client favorite properties`);

    // 15. Import client favorite agents
    console.log("\n15. Importing client favorite agents...");
    const clientFavAgentsData = loadJson("client_favorite_agents_1760024780070.json");
    for (const fav of clientFavAgentsData) {
      const transformed = transformDates(fav, ["created_at"]);
      await db.insert(clientFavoriteAgents).values({
        id: transformed.id,
        clientId: transformed.client_id,
        agentId: transformed.agent_id,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${clientFavAgentsData.length} client favorite agents`);

    // 16. Import client favorite agencies
    console.log("\n16. Importing client favorite agencies...");
    const clientFavAgenciesData = loadJson("client_favorite_agencies_1760024780070.json");
    for (const fav of clientFavAgenciesData) {
      const transformed = transformDates(fav, ["created_at"]);
      await db.insert(clientFavoriteAgencies).values({
        id: transformed.id,
        clientId: transformed.client_id,
        agencyId: transformed.agency_id,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${clientFavAgenciesData.length} client favorite agencies`);

    // 17. Import agent favorite properties
    console.log("\n17. Importing agent favorite properties...");
    const agentFavPropsData = loadJson("agent_favorite_properties_1760024780069.json");
    for (const fav of agentFavPropsData) {
      const transformed = transformDates(fav, ["created_at"]);
      await db.insert(agentFavoriteProperties).values({
        id: transformed.id,
        agentId: transformed.agent_id,
        propertyId: transformed.property_id,
        createdAt: transformed.created_at || new Date(),
      }).onConflictDoNothing();
    }
    console.log(`✓ Imported ${agentFavPropsData.length} agent favorite properties`);

    // 18. Import property visit requests (if any)
    console.log("\n18. Importing property visit requests...");
    const visitRequestsData = loadJson("property_visit_requests_1760024780064.json");
    if (visitRequestsData.length > 0) {
      for (const request of visitRequestsData) {
        const transformed = transformDates(request, ["requested_date", "created_at", "updated_at"]);
        await db.insert(propertyVisitRequests).values({
          id: transformed.id,
          propertyId: transformed.property_id,
          clientId: transformed.client_id,
          agentId: transformed.agent_id,
          requestedDate: transformed.requested_date,
          requestedTime: transformed.requested_time,
          status: transformed.status || "pending",
          clientNotes: transformed.client_notes,
          agentNotes: transformed.agent_notes,
          createdAt: transformed.created_at || new Date(),
          updatedAt: transformed.updated_at || new Date(),
        }).onConflictDoNothing();
      }
      console.log(`✓ Imported ${visitRequestsData.length} property visit requests`);
    } else {
      console.log(`✓ No property visit requests to import`);
    }

    console.log("\n✅ Database import completed successfully!");
  } catch (error) {
    console.error("\n❌ Error during import:", error);
    throw error;
  }
}

// Run the import
importData()
  .then(() => {
    console.log("\nImport process finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nImport process failed:", error);
    process.exit(1);
  });
