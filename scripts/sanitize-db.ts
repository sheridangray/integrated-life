#!/usr/bin/env tsx
/**
 * Sanitize Production Database Snapshot for Staging
 *
 * This script:
 * 1. Exports production MongoDB collections to JSON
 * 2. Sanitizes sensitive fields (emails, names, tokens, etc.)
 * 3. Imports into staging database
 *
 * Usage:
 *   MONGODB_URI_PROD=mongodb://... MONGODB_URI_STAGING=mongodb://... tsx scripts/sanitize-db.ts
 *
 * Can be run locally or in CI.
 */

import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';

// Models to sanitize (add more as needed)
const MODELS_TO_SANITIZE = ['User', 'Meal', 'FoodLog', 'HouseholdTask'];

// Fields that need anonymization
const SENSITIVE_FIELDS: Record<string, (value: any) => any> = {
  email: () => faker.internet.email(),
  given_name: () => faker.person.firstName(),
  family_name: () => faker.person.lastName(),
  name: () => faker.person.fullName(),
  phone: () => faker.phone.number(),
  address: () => faker.location.streetAddress(),
  birthdate: () => faker.date.past({ years: 50 }).toISOString().split('T')[0],
};

// Fields to remove entirely
const FIELDS_TO_REMOVE = [
  'refresh_token',
  'access_token',
  'token',
  'password',
  'ssn',
];

async function sanitizeDocument(doc: any): Promise<any> {
  const sanitized = { ...doc };

  // Remove sensitive fields
  for (const field of FIELDS_TO_REMOVE) {
    if (sanitized[field] !== undefined) {
      delete sanitized[field];
    }
  }

  // Anonymize PII fields
  for (const [field, generator] of Object.entries(SENSITIVE_FIELDS)) {
    if (sanitized[field] !== undefined) {
      const original = sanitized[field];
      if (typeof original === 'string' && original.length > 0) {
        sanitized[field] = generator(original);
      }
    }
  }

  // Preserve _id but clear any embedded sensitive data
  if (sanitized._id) {
    sanitized._id = new mongoose.Types.ObjectId();
  }

  return sanitized;
}

async function sanitizeDatabase(
  sourceUri: string,
  targetUri: string,
  sourceDbName: string,
  targetDbName: string
): Promise<void> {
  console.log('Sanitizing database...');
  console.log(`Source: ${sourceDbName}`);
  console.log(`Target: ${targetDbName}`);

  // Connect to both databases
  const sourceConn = await mongoose.createConnection(sourceUri, {
    dbName: sourceDbName,
  });
  const targetConn = await mongoose.createConnection(targetUri, {
    dbName: targetDbName,
  });

  console.log('Connected to databases');

  // Get list of collections from source
  const collections = await sourceConn.listCollections();

  for (const collection of collections) {
    const collectionName = collection.name;

    // Skip system collections
    if (collectionName.startsWith('system.')) {
      console.log(`Skipping system collection: ${collectionName}`);
      continue;
    }

    console.log(`Processing collection: ${collectionName}`);

    // Fetch all documents from source
    const docs = await sourceConn.connection.db
      .collection(collectionName)
      .find({})
      .toArray();

    console.log(`  Found ${docs.length} documents`);

    // Sanitize each document
    const sanitizedDocs = await Promise.all(
      docs.map(async (doc) => {
        const sanitized = await sanitizeDocument(doc);
        // Map original _id to new _id for references
        return {
          originalId: doc._id,
          sanitized,
        };
      })
    );

    // Build a mapping from original _id to new _id for FK regen
    // (This is simplified; in production you'd need to update all FK refs)
    const idMap = new Map(
      sanitizedDocs.map((d) => [
        d.originalId.toString(),
        d.sanitized._id.toString(),
      ])
    );

    // Clear target collection
    await targetConn.connection.db.collection(collectionName).deleteMany({});

    // Insert sanitized documents
    if (sanitizedDocs.length > 0) {
      await targetConn.connection.db
        .collection(collectionName)
        .insertMany(sanitizedDocs.map((d) => d.sanitized));
    }

    console.log(`  Inserted ${sanitizedDocs.length} sanitized documents`);
  }

  // Close connections
  await sourceConn.close();
  await targetConn.close();

  console.log('Sanitization complete!');
}

// Main execution
async function main() {
  const sourceUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI!;
  const targetUri = process.env.MONGODB_URI_STAGING || process.env.MONGODB_URI!;
  const sourceDbName = process.env.MONGODB_DB_NAME_PROD || 'integrated-life-prod';
  const targetDbName = process.env.MONGODB_DB_NAME_STAGING || 'integrated-life-staging';

  if (!sourceUri || !targetUri) {
    console.error('Error: MONGODB_URI_PROD and MONGODB_URI_STAGING must be set');
    process.exit(1);
  }

  try {
    await sanitizeDatabase(sourceUri, targetUri, sourceDbName, targetDbName);
    process.exit(0);
  } catch (error) {
    console.error('Sanitization failed:', error);
    process.exit(1);
  }
}

main();