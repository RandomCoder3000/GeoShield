import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { GeoService } from '@/server/geo.service';
import { authOptions } from '@/lib/auth';
import xss from 'xss'; // HTML sanitizer

// Zod Schema for strict input validation
const CreateCacheSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(5000),
  hint: z.string().max(500).optional(),
  difficulty: z.number().min(1).max(5),
  terrain: z.number().min(1).max(5),
  size: z.enum(['micro', 'small', 'regular', 'large']),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  safetyChecked: z.literal(true), // Enforce safety checklist
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth Check (Server-side)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input Validation & Sanitization
    const body = await req.json();
    const parsed = CreateCacheSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;
    const sanitizedDescription = xss(data.description); // Prevent stored XSS

    // 3. Domain Logic: Geofence Check
    const isSafe = await GeoService.isLocationSafe(data.lat, data.lng);
    if (!isSafe) {
      return NextResponse.json({ 
        error: 'Location rejected: Falls within a restricted safety zone (e.g., school, military base).' 
      }, { status: 403 });
    }

    // 4. Database Transaction (Standard fields + PostGIS geometry)
    const newCache = await prisma.$transaction(async (tx) => {
      // Create the base record
      const cache = await tx.cache.create({
        data: {
          title: data.title,
          description: sanitizedDescription,
          hint: data.hint, // Assume frontend handles ROT13 encoding, or do it here
          difficulty: data.difficulty,
          terrain: data.terrain,
          size: data.size,
          lat: data.lat,
          lng: data.lng,
          status: 'PENDING', // Awaits Moderator approval
          userId: session.user.id,
        },
      });

      // Update PostGIS geography column (Prisma doesn't support this natively yet)
      await tx.$executeRaw`
        UPDATE "Cache" 
        SET location = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)::geography 
        WHERE id = ${cache.id}
      `;

      return cache;
    });

    return NextResponse.json(newCache, { status: 201 });

  } catch (error) {
    console.error('[CACHE_CREATE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
