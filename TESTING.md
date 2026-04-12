# Testing Guide

This document outlines testing procedures and guidelines for the Stroop Test application.

## Testing Strategy

The application should be tested at multiple levels:
1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API routes and database operations
3. **End-to-End Tests**: Complete user flows
4. **Manual Testing**: User experience and edge cases

## Setup Testing Environment

### Install Testing Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest
```

### Configure Jest

Create `jest.config.js`:
```javaI Agree" button creates session
- [ ] "I Do Not Agree" button exits properly
- [ ] Participant ID is generated (UUID format)
- [ ] Session is created in database

**Test Steps:**
```
1. Navigate to http://localhost:3000
2. Read consent information
3. Click "I Agree — Continue"
4. Verify redirect to instructions page
5. Check browser console for errors
6. Verify session in database: SELECT * FROM sessions ORDER BY started_at DESC LIMIT 1;
```

#### 2. Instructions Page
- [ ] Participant ID is displayed correctly
- 