# Post Jobs Feature Guide

## Overview
Users can now post new jobs directly through the application, but only after authenticating with Google. Posted jobs immediately appear on the Apply Jobs page.

## Key Features

### 1. **Authentication Required**
- Only authenticated users (via Google Login) can post jobs
- Unauthenticated users see a sign-in screen with Google login button
- Sign-in persists across sessions using browser cookies

### 2. **Job Posting Form**
The form includes the following fields:
- **Job Title** (required) - e.g., "Senior Frontend Engineer"
- **Company Name** (required) - e.g., "Tech Company Inc."
- **Location** (required) - e.g., "Bangalore, India"
- **Employment Type** (required) - Dropdown with options:
  - Full-time
  - Part-time
  - Contract
  - Internship
  - Freelance
- **Minimum Salary** (optional) - Numeric input
- **Maximum Salary** (optional) - Numeric input
- **Job Description** (required) - Multi-line textarea for detailed job info

### 3. **Automatic Data Sync**
When a job is posted:
1. Data is sent to backend: `POST /api/jobs`
2. Success message appears: "✅ Job posted successfully! Redirecting to jobs page..."
3. After 2 seconds, user is redirected to the Apply Jobs page
4. The newly posted job appears in the list with "Local" source badge
5. Filters automatically update to include new location and company

### 4. **Real-time Refresh**
- Added "🔄 Refresh" button in the filter bar on Apply Jobs page
- Click to reload all jobs without page refresh
- Shows spinning animation while refreshing
- Seamlessly updates job list with any new postings

## User Flow

```
1. User clicks "Post a Job" from Dashboard
   ↓
2. Check Authentication
   ├─ If Not Logged In → Show Sign-In Screen
   │  └─ User clicks "Sign in with Google" → Redirects to Google OAuth
   │
   └─ If Logged In → Show Job Posting Form
      ↓
3. User fills out form and clicks "Post Job"
   ↓
4. Form Validation & API Call
   ├─ Required fields validated
   ├─ Data sent to: POST /api/jobs
   ├─ "Posting..." state shown with spinner
   │
   └─ On Success → Show success message & redirect to /apply-jobs after 2 seconds
      ↓
5. New job appears in Apply Jobs page with:
   - Source: "Local"
   - Full job details
   - Visible to all users
```

## API Integration

### PostJobs Component
The component makes the following API call:

```javascript
const response = await axios.post(
  "http://localhost:8080/api/jobs",
  jobData,
  {
    withCredentials: true,  // Sends authentication cookies
  }
);
```

**Request Payload:**
```javascript
{
  title: string,
  description: string,
  company: string,
  location: string,
  employmentType: string,
  job_min_salary: number | null,
  job_max_salary: number | null,
}
```

### Backend Endpoint Requirements
The backend must support:
- `POST /api/jobs` - Create new job (already exists in JobController.java)
- Accepts JSON payload with job details
- Returns saved job object
- Uses authentication from session/cookies

## Security Notes

✅ **Authentication Check**
- Backend should verify user is authenticated via OAuth/session
- Consider adding authorization to prevent non-authorized users from posting

### Recommended Backend Enhancements
```java
@PostMapping
@PreAuthorize("isAuthenticated()")  // Add this annotation
public Job createJob(@RequestBody Job job) {
    // Only authenticated users can create jobs
    return jobRepository.save(job);
}
```

## Error Handling

### Client-Side Error Handling
- **Network Errors**: Alert displays error message
- **Validation Errors**: Form fields remain populated for correction
- **Server Errors**: HTTP error response message shown to user
- **Disabled Buttons**: During submission, buttons are disabled with "Posting..." state

### Error Messages
- "Please sign in to post a job" - When not authenticated
- "Failed to post job. Please try again." - Generic error message
- Server-specific errors from backend response

## Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│          Post Jobs Form                         │
│  (Dashboard → /post-jobs)                       │
└──────────────┬──────────────────────────────────┘
               │
               ↓
        ┌──────────────┐
        │  Validate    │
        │  & Check     │
        │  Auth        │
        └──────┬───────┘
               │
               ↓
    ┌──────────────────────┐
    │ POST /api/jobs       │
    │ (Backend saves job)  │
    └──────────┬───────────┘
               │
               ↓
    ┌──────────────────────┐
    │ Show Success         │
    │ Message & Wait 2s    │
    └──────────┬───────────┘
               │
               ↓
    ┌──────────────────────────────┐
    │ Redirect to /apply-jobs      │
    │ (New job visible in list)    │
    │ OR Click "🔄 Refresh" button │
    └──────────────────────────────┘
```

## Testing the Feature

### Test Case 1: Unauthenticated User
1. Visit `/post-jobs` without logging in
2. Should see "Sign in Required" screen
3. Click "Sign in with Google"
4. Should redirect to Google OAuth

### Test Case 2: Authenticated User - Successful Post
1. Log in with Google
2. Navigate to "Post a Job"
3. Fill all required fields
4. Click "Post Job"
5. See success message
6. Auto-redirect to /apply-jobs
7. New job appears in the list with "Local" badge

### Test Case 3: Filter Updates
1. Post job with new location (e.g., "New York, USA")
2. On Apply Jobs page, open Location filter
3. New location should be available
4. Same for Company filter

### Test Case 4: Manual Refresh
1. Post a new job
2. On Apply Jobs page, click "🔄 Refresh"
3. Button shows spinner
4. Job list updates with newest jobs

## Future Enhancements

- [ ] Add job editing capability for posted jobs
- [ ] Add job deletion capability
- [ ] Show "Posted by me" badge on user's own posts
- [ ] Add job draft functionality (save incomplete forms)
- [ ] Email notifications when jobs receive applications
- [ ] Analytics dashboard for job posters
- [ ] Image/logo upload for jobs
- [ ] Advanced job description editor (rich text)
- [ ] Batch job posting
- [ ] Job templates for common positions

## Component Files Modified

1. **PostJobs.jsx** - Complete job posting form with auth check
2. **JobList.jsx** - Added refresh button and loadJobs function extraction
3. **App.jsx** - Routes already configured

## Styling & UX

✨ **Polish Details**
- Smooth loading animations
- Disabled state for buttons during submission
- Success/error message display
- Form validation feedback
- Mobile-responsive design
- Focus states for accessibility
- Consistent color scheme (green for success, red for errors)

All styling uses Tailwind CSS for consistency with the rest of the application.

