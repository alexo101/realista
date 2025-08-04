# Property Toggle Fix Plan

## Problem Analysis
The toggle switch is showing disabled all the time and always displays "activated and visible" message when clicked.

## Root Cause Investigation
1. **PropertyForm.tsx** - Toggle in edit mode (line 903)
   - Uses `isActive` state but may not be syncing with actual property data
   - State management issue between form state and property state

2. **PropertyActions.tsx** - Toggle in manage view 
   - Has proper state sync with useEffect
   - May have different behavior than PropertyForm

## Issues Identified
1. **State Synchronization**: The `isActive` state in PropertyForm may not be properly initialized or updated
2. **Toggle Logic**: The switch appears disabled but still triggers actions
3. **Message Logic**: Always shows "activated" regardless of actual state

## Fix Strategy

### Step 1: Check State Initialization
- Examine how `isActive` is initialized in PropertyForm
- Ensure it reflects the actual property's isActive value

### Step 2: Fix State Management
- Add proper useEffect to sync state with property data
- Ensure toggle reflects real property status

### Step 3: Fix Toggle Mutation Response
- Ensure mutation success handler updates local state correctly
- Fix the message logic to show correct status

### Step 4: Consolidate Toggle Logic
- Make PropertyForm and PropertyActions use same pattern
- Ensure consistency across components

## Implementation Order
1. Fix PropertyForm state initialization
2. Add proper state sync with useEffect
3. Fix mutation success handler
4. Test toggle behavior
5. Verify message accuracy