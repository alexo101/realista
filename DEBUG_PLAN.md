# Debug Plan: Application Preview Issues

## Problem Analysis
The application shows "Start application" workflow status as "failed" but appears to be running on port 5001. The logs show:
- Email service initializes successfully
- Port 5000 is already in use, trying port 5001
- Express serving on both port 5000 and 5001 (confusing logs)

## Root Cause Hypothesis
1. **Port Conflict**: Application trying to use port 5000 but falling back to 5001
2. **Workflow Status**: Workflow monitoring expects port 5000 but app runs on 5001
3. **Database Connection**: Potential WebSocket/database connection issues
4. **Component Errors**: New ConversationalMessages component might have runtime errors

## Step-by-Step Fix Plan

### Step 1: Check Current Application Status
- Check if server is actually running and responding
- Test basic API endpoints
- Verify database connection

### Step 2: Fix Port Configuration
- Check server/index.ts for port configuration
- Ensure consistent port usage
- Update any hardcoded port references

### Step 3: Verify Component Integration
- Check ConversationalMessages component for runtime errors
- Verify all imports and dependencies
- Test component rendering

### Step 4: Database Connection Check
- Test database connectivity
- Check for any schema/migration issues
- Verify WebSocket connections

### Step 5: Restart and Verify
- Restart the workflow cleanly
- Test the Messages section functionality
- Verify conversational interface works

## Expected Outcome
- Application runs successfully on consistent port
- No runtime errors in browser console
- ConversationalMessages component loads and functions properly
- User can preview changes in Messages section