
// MIGRATION SHIM
// This file exists to reroute legacy imports from '../firebase' to the new Netlify client.
// This prevents the application from crashing due to missing Firebase configuration
// while allowing existing views to function without manual refactoring.

export { dbService } from './lib/netlify-client';
