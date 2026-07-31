import Parse from 'parse/node';
import dotenv from 'dotenv';
dotenv.config();

const appId = process.env.APP_ID || 'superadmin';
const masterKey = process.env.MASTER_KEY || 'SAdminMasterKey123';
const serverUrl = process.env.SERVER_URL || 'http://127.0.0.1:9000/app';

Parse.initialize(appId, null, masterKey);
Parse.serverURL = serverUrl;

async function run() {
  const user = new Parse.User();
  user.set('username', 'admin@toowix.com');
  user.set('email', 'admin@toowix.com');
  user.set('password', 'AdminPassword123');
  user.set('role', 'super_admin');

  try {
    await user.signUp(null, { useMasterKey: true });
    console.log('==================================================');
    console.log('  Super Admin user created successfully!');
    console.log('  Username/Email: admin@toowix.com');
    console.log('  Password: AdminPassword123');
    console.log('==================================================');
  } catch (error) {
    console.error('Failed to create user:', error.message);
  }
}

run();
