/**
 * AWS Lambda handler for ParkShare backend.
 *
 * Wraps the Express.js application for deployment behind API Gateway.
 * Uses the serverless-http adapter to translate API Gateway events
 * into Express-compatible request/response objects.
 *
 * This file is the Lambda entry point (dist/lambda.handler).
 * The SAM template points CodeUri to ../backend/ and Handler to dist/lambda.handler.
 *
 * Owner: Person 3 (AWS Infrastructure)
 * Do NOT add business logic here — that belongs in app.ts and handlers.
 */
import serverless from 'serverless-http';
// Backend builds into dist/src/app.js when tsc compiles
import { app } from './src/app';

export const handler = serverless(app);
