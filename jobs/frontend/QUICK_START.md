# Quick Start Guide - Job Posting Feature

## 🎯 Quick Overview

You now have a complete job posting system where:
- ✅ Only logged-in users can post jobs
- ✅ Posted jobs instantly appear on the job list
- ✅ Users can refresh the job list manually
- ✅ All jobs are stored in the database

## 🏃 5-Minute Setup

### 1. Install Dependencies (Already Done)
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Server runs at: `http://localhost:5173`

### 3. Visit the Application
```
http://localhost:5173/
         ↓
      Dashboard
      ↙      ↘
  Apply Jobs  Post Jobs
```

## 🎬 Try It Out

### Scenario 1: Post a Job

1. **Go to Dashboard**
   - URL: `http://localhost:5173/`

2. **Click "Post a Job"**
   - Takes you to `/post-jobs`

3. **Not Logged In?**
   - See: "🔐 Sign in Required"
   - Click: "Sign in with Google"
   - Sign in with your Google account

4. **Fill the Form**
   ```
   Title: Senior Developer
   Company: Your Company
   Location: New York, USA
   Employment Type: Full-time
   Min Salary: 100000
   Max Salary: 150000
   Description: Great opportunity to work on...
   ```

5. **Click "Post Job"**
   - See spinner: "Posting..."
   - Wait for success: "✅ Job posted successfully!"
   - Auto-redirect to job list after 2 seconds

6. **Your Job Appears!**
   - See your new job with "Local" badge
   - Visible to all users

### Scenario 2: See Posted Jobs

1. **Go to Apply Jobs**
   - Click from Dashboard
   - Or visit: `/apply-jobs`

2. **See All Jobs**
   - Local jobs (posted by users)
   - External jobs (from RapidAPI)

3. **Use Filters**
   - Search by title
   - Filter by source
   - Filter by location
   - Filter by company

4. **Refresh List**
   - Click "🔄 Refresh" button
   - See latest postings

## 📋 Form Fields Explained

| Field | Required | Example | Purpose |
|-------|----------|---------|---------|
| Title | ✅ Yes | Senior Engineer | Job position name |
| Company | ✅ Yes | Google | Company hiring |
| Location | ✅ Yes | Mountain View, CA | Work location |
| Employment Type | ✅ Yes | Full-time | Job type |
| Min Salary | ❌ No | 100000 | Salary range min |
| Max Salary | ❌ No | 150000 | Salary range max |
| Description | ✅ Yes | We are looking for... | Full job details |

## 🔐 Authentication

**Requirements**:
- Must have a Google account
- Click "Sign in with Google"
- Approve permission request

**After Login**:
- Your name appears in header
- Logout button available
- Can post jobs
- Can apply to jobs

## 🎨 UI Elements

### Dashboard
```
┌─────────────────────────────────────┐
│  🚀 Welcome to Saarthix Jobs        │
│                                     │
│  [💼 Apply Jobs]  [📝 Post Jobs]   │
└─────────────────────────────────────┘
```

### Post Jobs Page (Not Logged In)
```
┌─────────────────────────────────────┐
│  🔐 Sign in Required                │
│                                     │
│  You need to authenticate to post   │
│                                     │
│  [Sign in with Google]              │
└─────────────────────────────────────┘
```

### Post Jobs Page (Logged In)
```
┌─────────────────────────────────────┐
│  📝 Post a New Job                  │
│                                     │
│  Title: [_______________]           │
│  Company: [_______________]         │
│  Location: [_______________]        │
│  Type: [Full-time ▼]               │
│  Min: [________]  Max: [________]   │
│  Description: [_________________]   │
│                                     │
│  [Post Job]  [Cancel]              │
└─────────────────────────────────────┘
```

### Apply Jobs Page
```
┌──────────────────────────────────────┐
│  Search: [__________] 🔍            │
│                                      │
│  [All Sources ▼] [All Locations ▼] │
│  [All Companies ▼] [🔄 Refresh]    │
│                                      │
│  Found 12 jobs matching filters      │
│                                      │
│  ┌──────────────────────┐            │
│  │ Senior Frontend      │            │
│  │ Company: ABC Inc     │            │
│  │ 📍 Bangalore         │            │
│  │ [View Details]       │            │
│  └──────────────────────┘            │
│  ... more jobs ...                   │
└──────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Problem: Can't Post Jobs
**Solution**: Make sure you're logged in
- Check if your name appears in header
- If not, click login in header
- Then go to Post Jobs

### Problem: Posted Job Doesn't Appear
**Solution**: Click "🔄 Refresh" button
- Manually refreshes the job list
- Shows newly posted jobs

### Problem: Login Not Working
**Solution**: Check these:
1. Pop-ups not blocked?
2. Cookies enabled?
3. Google account valid?
4. Try incognito window

### Problem: Form Submission Hangs
**Solution**: 
1. Check browser console (F12)
2. Make sure backend is running
3. Verify backend URL is correct

## 🔗 Important URLs

```
Dashboard:          http://localhost:5173/
Apply Jobs:         http://localhost:5173/apply-jobs
Post Jobs:          http://localhost:5173/post-jobs

Backend API:
- Get All Jobs:     http://localhost:8080/api/jobs
- Create Job:       http://localhost:8080/api/jobs (POST)
- Check Auth:       http://localhost:8080/api/auth/check
```

## 💾 Database Persistence

✅ **What Gets Saved**:
- Job title
- Company name
- Location
- Employment type
- Salary range
- Description
- Created timestamp

✅ **What Persists**:
- Jobs stay in database permanently
- Visible to all users
- Can be filtered and searched

## 📱 Mobile Support

✅ Fully responsive
- Works on phones
- Works on tablets
- Works on desktop

## 🎯 Next Steps

1. **Test Posting**
   - Post a few test jobs
   - See them appear in list
   - Verify details are correct

2. **Test Filtering**
   - Search by job title
   - Filter by location
   - Filter by company
   - Use refresh button

3. **Test Authentication**
   - Log out
   - Try accessing /post-jobs
   - Should see sign-in screen

4. **Test Error Handling**
   - Try submitting empty form
   - Watch for validation messages

## 📚 Full Documentation

For detailed information, see:
- `POST_JOBS_GUIDE.md` - Complete feature guide
- `FEATURE_COMPLETE.md` - All features explained
- `IMPLEMENTATION_SUMMARY.md` - Technical details

## ✨ That's It!

You're ready to post jobs! 🎉

```
1. Go to Dashboard
2. Click "Post a Job"
3. Sign in with Google
4. Fill the form
5. Click "Post Job"
6. See it on Apply Jobs page!
```

---

**Need Help?** Check the documentation files or review the error messages in the browser console.

**Ready to Go!** ✅

