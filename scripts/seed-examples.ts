import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding example scenarios...\n');

  // Example 1: Demo SaaS Tenant
  const scenario1 = await prisma.scenario.upsert({
    where: { name: 'create-demo-saas-tenant' },
    update: {},
    create: {
      name: 'create-demo-saas-tenant',
      description: 'Creates a full demo tenant with users and projects for SaaS demo',
      targetType: 'DB',
      targetConfigJson: {
        connectionString: 'postgresql://postgres:postgres@localhost:5432/saas_demo?schema=public',
      },
      stepsJson: [
        {
          type: 'db:insert',
          table: 'tenants',
          values: {
            id: 'demo-tenant-001',
            name: 'Acme Corporation',
            plan: 'enterprise',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
        {
          type: 'db:insert',
          table: 'users',
          values: {
            id: 'user-admin-001',
            tenant_id: 'demo-tenant-001',
            email: 'admin@acme.com',
            name: 'Admin User',
            role: 'admin',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
        {
          type: 'db:insert',
          table: 'projects',
          values: {
            id: 'project-001',
            tenant_id: 'demo-tenant-001',
            name: 'Website Redesign',
            description: 'Redesign company website',
            owner_id: 'user-admin-001',
            status: 'in_progress',
            created_at: '2024-01-05T00:00:00Z',
          },
        },
      ],
    },
  });
  console.log(`✓ Created scenario: ${scenario1.name}`);

  // Example 2: Welfare Facility Residents
  const scenario2 = await prisma.scenario.upsert({
    where: { name: 'create-welfare-facility-residents' },
    update: {},
    create: {
      name: 'create-welfare-facility-residents',
      description: 'Generates realistic resident data for welfare-facility-erp-suite testing',
      targetType: 'DB',
      targetConfigJson: {
        connectionString: 'postgresql://postgres:postgres@localhost:5432/welfare_erp?schema=public',
      },
      stepsJson: [
        {
          type: 'db:insert',
          table: 'facilities',
          values: {
            id: 'facility-001',
            name: 'Sunrise Senior Living',
            address: '123 Care Street, Springfield',
            capacity: 50,
            facility_type: 'assisted_living',
            license_number: 'FL-2024-001',
            created_at: '2024-01-01T00:00:00Z',
          },
        },
        {
          type: 'db:insert',
          table: 'residents',
          values: {
            id: 'resident-001',
            facility_id: 'facility-001',
            first_name: 'Margaret',
            last_name: 'Smith',
            date_of_birth: '1945-03-15',
            admission_date: '2024-01-15',
            room_number: '101A',
            care_level: 'level_2',
            medical_record_number: 'MRN-2024-001',
            emergency_contact_name: 'Robert Smith',
            emergency_contact_phone: '555-0101',
            emergency_contact_relation: 'Son',
          },
        },
        {
          type: 'db:insert',
          table: 'care_plans',
          values: {
            id: 'care-plan-001',
            resident_id: 'resident-001',
            plan_type: 'comprehensive',
            created_by: 'staff-001',
            created_at: '2024-01-16T00:00:00Z',
            review_date: '2024-04-16',
            mobility_assistance: true,
            medication_management: true,
            dietary_restrictions: 'Low sodium, diabetic-friendly',
            activities_of_daily_living: 'Requires assistance with bathing and dressing',
          },
        },
      ],
    },
  });
  console.log(`✓ Created scenario: ${scenario2.name}`);

  // Example 3: API User Registration Flow
  const scenario3 = await prisma.scenario.upsert({
    where: { name: 'api-user-registration-flow' },
    update: {},
    create: {
      name: 'api-user-registration-flow',
      description: 'Tests complete user registration and onboarding via API',
      targetType: 'API',
      targetConfigJson: {
        baseUrl: 'https://api.example.com',
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      },
      stepsJson: [
        {
          type: 'api:request',
          method: 'POST',
          path: '/v1/auth/register',
          body: {
            email: 'testuser@example.com',
            password: 'SecurePass123!',
            name: 'Test User',
            company: 'Test Company',
          },
        },
        {
          type: 'api:request',
          method: 'POST',
          path: '/v1/auth/verify-email',
          body: {
            email: 'testuser@example.com',
            code: '123456',
          },
        },
        {
          type: 'api:request',
          method: 'GET',
          path: '/v1/user/profile',
          headers: {
            Authorization: 'Bearer {{last_response.data.token}}',
          },
        },
      ],
    },
  });
  console.log(`✓ Created scenario: ${scenario3.name}`);

  console.log('\n✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
