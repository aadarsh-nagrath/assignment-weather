const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      email: 'demo@weather.com',
      password: 'demo123'
    }
  })

  const cities = [
    {
      name: 'London',
      country: 'GB',
      lat: 51.5074,
      lon: -0.1278,
      userId: user.id
    },
    {
      name: 'New York',
      country: 'US',
      lat: 40.7128,
      lon: -74.0060,
      userId: user.id
    },
    {
      name: 'Tokyo',
      country: 'JP',
      lat: 35.6762,
      lon: 139.6503,
      userId: user.id
    },
    {
      name: 'Paris',
      country: 'FR',
      lat: 48.8566,
      lon: 2.3522,
      userId: user.id
    },
    {
      name: 'Sydney',
      country: 'AU',
      lat: -33.8688,
      lon: 151.2093,
      userId: user.id
    }
  ]

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name_country: { name: city.name, country: city.country } },
      update: {},
      create: city
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
