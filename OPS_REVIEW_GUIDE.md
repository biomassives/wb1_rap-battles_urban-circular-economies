# Ops Review Dashboard Guide

## Overview

The **Ops Review Dashboard** (`/ops-review`) is a comprehensive monitoring and testing tool that allows users of different roles to verify system functionality through automated UI tests.

## Access

Visit: `http://localhost:4321/ops-review`

## Features

### 1. **Role-Based Testing**

Tests are organized by user role:

#### 👤 User Role
- Basic functionality tests
- Wallet connection
- Page navigation
- Data loading

#### 🎵 Artist Role
- All User tests +
- XP award system
- Progress tracking
- Creative features

#### 🔑 Admin Role
- All Artist tests +
- Administrative functions
- Moderation tools
- Analytics access

#### 💻 Developer Role
- All tests +
- API endpoint health
- Database connectivity
- System diagnostics
- JSON data loading

### 2. **System Health Monitoring**

Real-time health checks for:
- **API Endpoints** - Backend API status
- **localStorage** - Browser storage availability
- **Database** - Database connection status
- **Frontend** - UI system status

### 3. **Automated Test Suite**

#### localStorage Tests
- ✅ localStorage Available
- ✅ Can Write to localStorage

#### Wallet Tests
- ✅ Wallet Manager Initialized
- ✅ Can Connect Test Wallet

#### Progress System Tests
- ✅ Progress Manager Initialized
- ✅ Can Load Progress Data
- ✅ Can Award XP Locally

#### API Tests
- ✅ /api/gamification/user-progress
- ✅ /api/kakuma/user-impact

#### Data Loading Tests
- ✅ Can Load Sample Users JSON
- ✅ Can Load Sample Battles JSON

#### UI System Tests
- ✅ UI Manager Initialized

#### Navigation Tests
- ✅ Essential Pages Exist

## How to Use

### Running Tests

1. **Select Your Role**
   - Click one of the role buttons (User, Artist, Admin, Developer)
   - Role description shows what tests will run

2. **Run Tests**
   - **Run All Tests** - Runs entire test suite
   - **Run Role Tests** - Runs only tests for selected role

3. **View Results**
   - Tests display in real-time
   - Color-coded status (✅ Pass, ❌ Fail, ⚠️ Warning)
   - Execution time shown for each test
   - Detailed error messages for failures

4. **Export Results**
   - Click "Export Results" to download JSON report
   - Useful for bug reports or documentation

## Test Results

### Result Format

Each test shows:
- **Status Icon**: ✅ (passed), ❌ (failed), ⚠️ (warning/error)
- **Test Name**: Descriptive name of test
- **Message**: Result summary
- **Duration**: Execution time in milliseconds
- **Role Tag**: Which role this test belongs to
- **Details**: Additional technical information (if available)

### Summary Metrics

- **Total Tests**: Number of tests run
- **Passed**: Number of successful tests
- **Failed**: Number of failed tests
- **Warnings**: Number of tests with warnings
- **Success Rate**: Percentage of passed tests

## Test Categories

Tests are grouped by category:

1. **localStorage** - Browser storage tests
2. **Wallet** - Wallet connection tests
3. **Progress System** - XP and progression tests
4. **API** - Backend API endpoint tests
5. **Data Loading** - JSON data loading tests
6. **UI System** - UI manager tests
7. **Navigation** - Page accessibility tests

## Understanding Test Results

### ✅ Passed
System is working as expected. No action needed.

### ❌ Failed
Something is broken. Check the error message and details.

Common failures:
- **API offline**: Using localStorage fallback (expected if database not connected)
- **404 errors**: Page or endpoint doesn't exist
- **Connection refused**: Server not running

### ⚠️ Warning
Non-critical issue. System may work but not optimally.

Common warnings:
- **Slow response times**: API taking longer than expected
- **Missing data**: Optional features not available
- **Degraded mode**: Running on fallback systems

## Troubleshooting

### "API endpoints failing"
**Expected Behavior**: If databases aren't connected yet, APIs will return errors but the app falls back to localStorage. This is normal.

**Action**: No action needed if testing locally. When deploying, ensure database environment variables are set.

### "localStorage unavailable"
**Issue**: Browser privacy settings blocking localStorage

**Action**:
- Check browser settings
- Disable private/incognito mode
- Allow site to store data

### "Wallet tests failing"
**Issue**: WalletManager not initialized

**Action**:
- Refresh the page
- Check browser console for errors
- Ensure BaseLayout.astro loaded correctly

### "Navigation tests failing"
**Issue**: Pages return 404

**Action**:
- Run `npm run build` to rebuild
- Check that pages exist in `src/pages/`
- Verify dev server is running

## Adding Custom Tests

You can add your own tests by editing `/ops-review.astro`:

```javascript
// Add in the defineTests() function
runner.addTest('Category', 'Test Name', 'role', async () => {
  try {
    // Your test logic here
    const result = await someTestFunction();

    return {
      pass: result === expectedValue,
      message: 'Test passed!',
      details: 'Additional info'
    };
  } catch (error) {
    return {
      pass: false,
      message: error.message
    };
  }
});
```

### Test Parameters

- **Category**: Group name (e.g., 'API', 'Wallet', 'UI System')
- **Test Name**: Descriptive name
- **Role**: 'all', 'user', 'artist', 'admin', or 'developer'
- **testFn**: Async function that returns `{ pass, message, details? }`

## Export Format

Exported JSON includes:

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "role": "developer",
  "summary": {
    "total": 15,
    "passed": 12,
    "failed": 3
  },
  "tests": [
    {
      "category": "localStorage",
      "name": "localStorage Available",
      "role": "all",
      "status": "passed",
      "message": "localStorage is available",
      "duration": 2
    }
    // ... more tests
  ]
}
```

## Best Practices

### For Users
- Run tests after major updates
- Check before reporting bugs
- Export results when filing issues

### For Artists
- Test XP award system after updates
- Verify progress tracking works
- Check localStorage persistence

### For Admins
- Run full test suite regularly
- Monitor system health dashboard
- Review failed tests before deployment

### For Developers
- Run all tests before commits
- Add tests for new features
- Export and archive test results
- Use in CI/CD pipelines

## Integration with Development

### Local Development

```bash
# Start dev server
npm run dev

# Visit ops review
open http://localhost:4321/ops-review

# Run tests
# Click "Run All Tests" button
```

### Pre-Deployment Checklist

1. ✅ Run all tests - ensure 100% pass rate
2. ✅ Check system health - all green
3. ✅ Test each role - verify role-specific features
4. ✅ Export results - document baseline
5. ✅ Deploy with confidence!

### CI/CD Integration (Future)

The ops review page can be automated:

```bash
# Example: Headless test runner (future enhancement)
npm run ops-test -- --role=developer --export=results.json
```

## Benefits

✅ **Visual Testing** - See all tests run in real-time
✅ **Role-Based** - Tests relevant to your use case
✅ **Quick Diagnostics** - Identify issues fast
✅ **Exportable** - Share results easily
✅ **No Setup** - Works out of the box
✅ **Comprehensive** - Covers all major systems

## Limitations

⚠️ **Client-Side Only**: Tests run in browser, can't test server-only features
⚠️ **No Authentication**: Can't test protected endpoints (yet)
⚠️ **Manual Triggering**: Not automated (add to CI/CD for automation)
⚠️ **Snapshot**: Tests current state, not historical trends

## Future Enhancements

Planned features:
- [ ] Historical test result tracking
- [ ] Automated scheduled testing
- [ ] Performance benchmarking
- [ ] Visual regression testing
- [ ] Email/Slack notifications
- [ ] Test result comparisons
- [ ] Custom test builder UI
- [ ] API authentication testing

## Support

Issues with ops review page?
1. Check browser console for errors
2. Verify all managers are initialized
3. Try refreshing the page
4. Export and share test results
5. Report on GitHub with exported JSON

---

**Pro Tip**: Bookmark `/ops-review` and check it regularly to catch issues early! 🔧✨
