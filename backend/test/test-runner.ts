import { execSync } from 'child_process';
import * as path from 'path';

const runTests = async () => {
  console.log('🧪 Starting Crypto Dashboard Backend Test Suite\n');

  try {
    console.log('📋 Running Unit Tests...');
    execSync('npm run test -- --testPathPattern=unit --verbose', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });

    console.log('\n📋 Running Integration Tests...');
    execSync('npm run test -- --testPathPattern=integration --verbose', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });

    console.log('\n📋 Running E2E Tests...');
    execSync('npm run test:e2e -- --verbose', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runTests();
}

export { runTests };
