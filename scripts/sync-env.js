#!/usr/bin/env node

/**
 * Script to sync environment variables from web app to mobile app
 * Reads .env.local from animatememories-master and updates .env in AnimateMemories
 */

const fs = require('fs');
const path = require('path');

const WEB_ENV_PATH = path.join(__dirname, '../../animatememories-master/.env.local');
const MOBILE_ENV_PATH = path.join(__dirname, '../.env');

// Map web env vars to mobile env vars
const ENV_MAPPING = {
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME': 'EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET': 'EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
  'NEXT_PUBLIC_CLOUDINARY_API_KEY': 'EXPO_PUBLIC_CLOUDINARY_API_KEY',
  'NEXT_PUBLIC_CLOUDINARY_API_SECRET': 'EXPO_PUBLIC_CLOUDINARY_API_SECRET',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
};

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    }
  });
  
  return env;
}

function updateMobileEnv(webEnv) {
  let mobileEnvContent = '';
  
  // Read existing mobile .env if it exists
  if (fs.existsSync(MOBILE_ENV_PATH)) {
    mobileEnvContent = fs.readFileSync(MOBILE_ENV_PATH, 'utf8');
  }
  
  // Parse existing mobile env
  const mobileEnv = parseEnvFile(MOBILE_ENV_PATH);
  
  // Update with synced values
  Object.keys(ENV_MAPPING).forEach(webKey => {
    if (webEnv[webKey]) {
      const mobileKey = ENV_MAPPING[webKey];
      mobileEnv[mobileKey] = webEnv[webKey];
    }
  });
  
  // Also sync API_BASE_URL if NEXT_PUBLIC_BASE_URL exists
  if (webEnv['NEXT_PUBLIC_BASE_URL']) {
    mobileEnv['EXPO_PUBLIC_API_BASE_URL'] = webEnv['NEXT_PUBLIC_BASE_URL'];
  }
  
  // Build new .env content
  const lines = [];
  
  // Preserve existing comments and structure
  const existingLines = mobileEnvContent.split('\n');
  let inClerkSection = false;
  let inApiSection = false;
  let inStripeSection = false;
  let inCloudinarySection = false;
  
  existingLines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.includes('CLERK')) {
      inClerkSection = true;
      inApiSection = false;
      inStripeSection = false;
      inCloudinarySection = false;
    } else if (trimmed.includes('API') || trimmed.includes('BASE_URL')) {
      inApiSection = true;
      inClerkSection = false;
      inStripeSection = false;
      inCloudinarySection = false;
    } else if (trimmed.includes('STRIPE')) {
      inStripeSection = true;
      inClerkSection = false;
      inApiSection = false;
      inCloudinarySection = false;
    } else if (trimmed.includes('CLOUDINARY')) {
      inCloudinarySection = true;
      inClerkSection = false;
      inApiSection = false;
      inStripeSection = false;
    }
    
    // Skip lines that will be replaced
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const key = trimmed.split('=')[0].trim();
      if (Object.values(ENV_MAPPING).includes(key) || key === 'EXPO_PUBLIC_API_BASE_URL') {
        return; // Skip, will be added later
      }
    }
    
    lines.push(line);
  });
  
  // Add synced environment variables
  if (!lines[lines.length - 1] || lines[lines.length - 1].trim() !== '') {
    lines.push('');
  }
  
  lines.push('# API Configuration');
  if (mobileEnv['EXPO_PUBLIC_API_BASE_URL']) {
    lines.push(`EXPO_PUBLIC_API_BASE_URL=${mobileEnv['EXPO_PUBLIC_API_BASE_URL']}`);
  }
  
  lines.push('');
  lines.push('# Stripe Configuration (synced from web app)');
  lines.push('# Stripe Publishable Key - safe to use in mobile apps');
  if (mobileEnv['EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY']) {
    lines.push(`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=${mobileEnv['EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY']}`);
  }
  
  lines.push('');
  lines.push('# Cloudinary Configuration (synced from web app)');
  if (mobileEnv['EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME']) {
    lines.push(`EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=${mobileEnv['EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME']}`);
  }
  if (mobileEnv['EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET']) {
    lines.push(`EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=${mobileEnv['EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET']}`);
  }
  if (mobileEnv['EXPO_PUBLIC_CLOUDINARY_API_KEY']) {
    lines.push(`EXPO_PUBLIC_CLOUDINARY_API_KEY=${mobileEnv['EXPO_PUBLIC_CLOUDINARY_API_KEY']}`);
  }
  if (mobileEnv['EXPO_PUBLIC_CLOUDINARY_API_SECRET']) {
    lines.push(`EXPO_PUBLIC_CLOUDINARY_API_SECRET=${mobileEnv['EXPO_PUBLIC_CLOUDINARY_API_SECRET']}`);
  }
  
  return lines.join('\n');
}

// Main execution
try {
  if (!fs.existsSync(WEB_ENV_PATH)) {
    console.error(`Error: Web .env.local file not found at ${WEB_ENV_PATH}`);
    console.log('Please make sure the web app has a .env.local file with the required variables.');
    process.exit(1);
  }
  
  console.log('Reading web app .env.local...');
  const webEnv = parseEnvFile(WEB_ENV_PATH);
  
  console.log('Updating mobile app .env...');
  const newMobileEnv = updateMobileEnv(webEnv);
  
  fs.writeFileSync(MOBILE_ENV_PATH, newMobileEnv, 'utf8');
  
  console.log('✅ Successfully synced environment variables from web to mobile app!');
  console.log('\nSynced variables:');
  Object.keys(ENV_MAPPING).forEach(webKey => {
    if (webEnv[webKey]) {
      console.log(`  ${webKey} → ${ENV_MAPPING[webKey]}`);
    }
  });
  if (webEnv['NEXT_PUBLIC_BASE_URL']) {
    console.log(`  NEXT_PUBLIC_BASE_URL → EXPO_PUBLIC_API_BASE_URL`);
  }
  
} catch (error) {
  console.error('Error syncing environment variables:', error.message);
  process.exit(1);
}









