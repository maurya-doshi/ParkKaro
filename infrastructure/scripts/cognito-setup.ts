#!/usr/bin/env node
/**
 * ParkShare — Cognito User Management Script
 *
 * Utility for managing Cognito users from the command line.
 * Used during development, seeding, and admin operations.
 *
 * Usage:
 *   npx ts-node scripts/cognito-setup.ts create-admin --email admin@parkshare.com --name "Admin" --password "Admin@123"
 *   npx ts-node scripts/cognito-setup.ts create-user  --email driver@test.com --name "Test Driver" --role DRIVER --password "Test@123"
 *   npx ts-node scripts/cognito-setup.ts list-users
 *
 * Environment variables required:
 *   AWS_REGION, COGNITO_USER_POOL_ID
 *
 * Owner: Person 3 (AWS Infrastructure)
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// ─── Configuration ───────────────────────────────────────────
const REGION = process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

if (!USER_POOL_ID) {
  console.error('❌ COGNITO_USER_POOL_ID environment variable is required.');
  console.error('   Set it from the SAM/CloudFormation stack output.');
  process.exit(1);
}

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

// ─── Helper Functions ────────────────────────────────────────

interface CreateUserOptions {
  email: string;
  name: string;
  role: 'DRIVER' | 'HOST' | 'ADMIN';
  password: string;
}

async function createUser(opts: CreateUserOptions): Promise<void> {
  const { email, name, role, password } = opts;

  console.log(`\n🔧 Creating user: ${email} (${role})`);

  // Step 1: Create the user in Cognito
  try {
    await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: name },
          { Name: 'custom:role', Value: role },
        ],
        MessageAction: 'SUPPRESS', // Don't send welcome email
      })
    );
    console.log(`   ✅ User created in Cognito`);
  } catch (err: any) {
    if (err.name === 'UsernameExistsException') {
      console.log(`   ⚠️  User already exists, updating attributes...`);
      await cognitoClient.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: USER_POOL_ID,
          Username: email,
          UserAttributes: [
            { Name: 'name', Value: name },
            { Name: 'custom:role', Value: role },
          ],
        })
      );
    } else {
      throw err;
    }
  }

  // Step 2: Set a permanent password
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    })
  );
  console.log(`   ✅ Password set`);

  // Step 3: Add to role group
  try {
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        GroupName: role,
      })
    );
    console.log(`   ✅ Added to group: ${role}`);
  } catch (err: any) {
    console.log(`   ⚠️  Could not add to group ${role}: ${err.message}`);
  }

  // Step 4: Get the user's sub (unique ID)
  const getUserResp = await cognitoClient.send(
    new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    })
  );
  const sub = getUserResp.UserAttributes?.find(a => a.Name === 'sub')?.Value;
  console.log(`   📋 Cognito sub (userId): ${sub}`);
  console.log(`   📧 Email: ${email}`);
  console.log(`   👤 Role: ${role}\n`);
}

async function listUsers(): Promise<void> {
  console.log('\n📋 Listing Cognito users...\n');

  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: 60,
    })
  );

  if (!response.Users || response.Users.length === 0) {
    console.log('   No users found.');
    return;
  }

  for (const user of response.Users) {
    const attrs = user.Attributes || [];
    const email = attrs.find(a => a.Name === 'email')?.Value || '—';
    const name = attrs.find(a => a.Name === 'name')?.Value || '—';
    const role = attrs.find(a => a.Name === 'custom:role')?.Value || '—';
    const sub = attrs.find(a => a.Name === 'sub')?.Value || '—';

    console.log(`   ${email.padEnd(30)} ${role.padEnd(8)} ${name.padEnd(20)} sub=${sub}`);
  }

  console.log(`\n   Total: ${response.Users.length} users\n`);
}

async function seedDemoUsers(): Promise<void> {
  console.log('\n🌱 Seeding demo users...\n');

  const demoUsers: CreateUserOptions[] = [
    { email: 'admin@parkshare.com', name: 'ParkShare Admin', role: 'ADMIN', password: 'Admin@2026!' },
    { email: 'host1@parkshare.com', name: 'Rahul Kumar', role: 'HOST', password: 'Host@2026!' },
    { email: 'host2@parkshare.com', name: 'Priya Sharma', role: 'HOST', password: 'Host@2026!' },
    { email: 'driver1@parkshare.com', name: 'Amit Singh', role: 'DRIVER', password: 'Driver@2026!' },
    { email: 'driver2@parkshare.com', name: 'Sneha Patel', role: 'DRIVER', password: 'Driver@2026!' },
  ];

  for (const user of demoUsers) {
    await createUser(user);
  }

  console.log('✅ Demo users seeded successfully!\n');
}

// ─── CLI ─────────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(3);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    args[key] = argv[i + 1] || '';
  }
  return args;
}

async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case 'create-admin': {
      const args = parseArgs();
      await createUser({
        email: args.email || 'admin@parkshare.com',
        name: args.name || 'ParkShare Admin',
        role: 'ADMIN',
        password: args.password || 'Admin@2026!',
      });
      break;
    }

    case 'create-user': {
      const args = parseArgs();
      if (!args.email || !args.role) {
        console.error('Usage: create-user --email <email> --role <DRIVER|HOST> --name <name> --password <pass>');
        process.exit(1);
      }
      await createUser({
        email: args.email,
        name: args.name || args.email.split('@')[0],
        role: args.role as 'DRIVER' | 'HOST' | 'ADMIN',
        password: args.password || 'ParkShare@2026!',
      });
      break;
    }

    case 'list-users':
      await listUsers();
      break;

    case 'seed-demo':
      await seedDemoUsers();
      break;

    default:
      console.log(`
ParkShare Cognito User Management

Commands:
  create-admin   Create an admin user
  create-user    Create a user with specified role
  list-users     List all Cognito users
  seed-demo      Create demo users for testing

Options:
  --email      User email
  --name       Display name
  --role       DRIVER | HOST | ADMIN
  --password   User password

Examples:
  npx ts-node scripts/cognito-setup.ts create-admin --email admin@parkshare.com --password "Admin@2026!"
  npx ts-node scripts/cognito-setup.ts create-user --email driver@test.com --role DRIVER --name "Test" --password "Test@2026!"
  npx ts-node scripts/cognito-setup.ts seed-demo
  npx ts-node scripts/cognito-setup.ts list-users

Environment:
  COGNITO_USER_POOL_ID  (required) — from CloudFormation output
  AWS_REGION            (optional) — defaults to ap-south-1
      `);
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
