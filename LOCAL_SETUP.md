# CodeAtlas - Local Setup Guide

## Quick Start (5 Minutes)

### Prerequisites
- Python 3.9+ installed
- Node.js 20+ installed
- Git installed

### Step 1: Backend Setup

Open a terminal and run:

```bash
# Navigate to backend directory
cd codeatlas/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn app.main:app --reload --port 8000
```

**Backend will be running at:** http://localhost:8000

**API Documentation:** http://localhost:8000/docs

### Step 2: Frontend Setup

Open a **new terminal** (keep backend running) and run:

```bash
# Navigate to frontend directory
cd codeatlas/frontend

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

**Frontend will be running at:** http://localhost:3000

### Step 3: Access the Application

Open your browser and go to: **http://localhost:3000**

---

## Using the Application

### Option 1: Demo Mode (Recommended for Quick Start)

1. On the homepage, you'll see three demo options:
   - **Enterprise E-commerce** (247 files)
   - **FinTech Platform** (189 files)
   - **Social Media App** (156 files)

2. Click **"Load Demo"** on any option

3. Explore the features:
   - Interactive dependency graph
   - CTO Dashboard metrics
   - AI Risk Narrator
   - Blast Radius Simulator
   - Before/After Comparison
   - Modernization Timeline

### Option 2: Scan Your Own Repository

1. Enter the **full path** to a local repository:
   - Windows: `C:\Users\YourName\Projects\my-repo`
   - macOS/Linux: `/Users/yourname/projects/my-repo`

2. Click **"Analyze Repository"**

3. Wait for the scan to complete

4. Explore the generated graph and insights

---

## Current Status

Based on your active terminals, you already have:

✅ **Backend running** on port 8000  
✅ **Frontend running** on port 3000

**You're ready to go!** Just open http://localhost:3000 in your browser.

---

## Troubleshooting

### Backend Issues

**Problem:** Port 8000 already in use
```bash
# Kill the process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8000 | xargs kill -9

# Then restart backend
python -m uvicorn app.main:app --reload --port 8000
```

**Problem:** Module not found errors
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

**Problem:** Virtual environment not activated
```bash
# You should see (venv) in your terminal prompt
# If not, activate it:
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### Frontend Issues

**Problem:** Port 3000 already in use
```bash
# The dev server will automatically use port 3001
# Or kill the process:
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Then restart frontend
npm run dev
```

**Problem:** Dependency installation fails
```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps

# Or clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Problem:** Cannot connect to backend
- Verify backend is running: http://localhost:8000/health
- Check `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Restart both servers

---

## Environment Variables

### Backend (.env) - Optional

Create `codeatlas/backend/.env` if you want to use watsonx.ai:

```bash
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-13b-chat-v2
```

**Note:** The app works perfectly with the mock AI provider (no credentials needed).

### Frontend (.env.local) - Already Configured

Your `codeatlas/frontend/.env.local` should have:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Testing the Setup

### 1. Test Backend

Open http://localhost:8000/docs in your browser. You should see the FastAPI interactive documentation.

Try the health check:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### 2. Test Frontend

Open http://localhost:3000 in your browser. You should see the CodeAtlas dashboard.

### 3. Test Demo Mode

1. Click on "Enterprise E-commerce" demo
2. Click "Load Demo"
3. You should see the dependency graph load instantly

### 4. Test Repository Scan

1. Enter a path to a local repository
2. Click "Analyze Repository"
3. Wait for the scan to complete
4. Verify the graph appears

---

## Development Workflow

### Making Changes

**Backend Changes:**
- Edit files in `codeatlas/backend/app/`
- FastAPI auto-reloads on save
- Check terminal for errors

**Frontend Changes:**
- Edit files in `codeatlas/frontend/`
- Next.js auto-reloads on save
- Check browser console for errors

### Viewing Logs

**Backend Logs:**
- Check the terminal running uvicorn
- Logs show API requests and errors

**Frontend Logs:**
- Check the terminal running npm dev
- Check browser console (F12)

---

## Stopping the Servers

### Stop Backend
Press `Ctrl+C` in the backend terminal

### Stop Frontend
Press `Ctrl+C` in the frontend terminal

### Deactivate Virtual Environment
```bash
deactivate
```

---

## Quick Commands Reference

### Backend
```bash
cd codeatlas/backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd codeatlas/frontend
npm run dev
```

### Both (Windows PowerShell)
```powershell
# Terminal 1 - Backend
cd codeatlas/backend; python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt; python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd codeatlas/frontend; npm install --legacy-peer-deps; npm run dev
```

---

## Next Steps

Once you have the app running locally:

1. **Explore Demo Mode** - Try all 3 demo repositories
2. **Test Your Own Code** - Scan a real repository
3. **Try All Features** - Click through every component
4. **Check Performance** - Verify smooth animations
5. **Test Error Handling** - Try invalid inputs
6. **Review Documentation** - Read all phase docs
7. **Prepare for Demo** - Practice the demo script

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the terminal logs for errors
3. Check browser console (F12) for frontend errors
4. Verify all prerequisites are installed
5. Ensure ports 8000 and 3000 are available

---

## Production Deployment

For deploying to production, see:
- [Hackathon Finalization Plan](HACKATHON_FINALIZATION_PLAN.md) - Section 4: Deployment Strategy
- [Quick Start Guide](QUICKSTART.md) - Deployment section

---

**You're all set! Happy coding! 🚀**