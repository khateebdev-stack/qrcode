/**
 * DEEP LINKING CONFIGURATION
 * 
 * CHANGES MADE:
 * 1. Updated prefixes to use 'qrcodeapp://' for app deep links
 * 2. Added Scanner screen to linking configuration
 * 3. Configured proper screen mapping for deep link navigation
 * 
 * PROBLEMS SOLVED:
 * - Deep links not working for in-app navigation
 * - Missing Scanner screen in deep link configuration
 * - Incorrect URL prefixes causing navigation failures
 * 
 * CONFIGURATION DETAILS:
 * - prefixes: Array of URL schemes that the app can handle
 * - config.screens: Maps URL paths to screen names
 * - Supports both app deep links and web URLs
 * 
 * SUPPORTED DEEP LINK PATTERNS:
 * - qrcodeapp://home → Home screen
 * - qrcodeapp://users → Users screen  
 * - qrcodeapp://user/123 → UserDetail screen with ID 123
 * - qrcodeapp://scanner → Scanner screen
 */

// Original configuration (commented out for reference)
// export default {
//   prefixes: ['myapp://'],
//   config: {
//     screens: {
//       UserDetail: 'user/:id',
//     },
//   },
// };

export default {
  prefixes: ['qrcodeapp://', 'https://sites.google.com/view/download-qrcode-app/'],
  config: {
    screens: {
      Home: 'home',
      Users: 'users',
      UserDetail: 'user/:id',
      Scanner: 'scanner',
      AppOnlyScanner: 'app-scanner',
    },
  },
};
 