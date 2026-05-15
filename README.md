# AI Form Fill — Prototype

Upload any form (image or PDF), AI detects all fields, fill them by talking naturally.

---

## Deploy to Vercel (5 minutes)

### Step 1 — Get the code into GitHub
1. Go to github.com and create a new repository (name it anything, e.g. `ai-form-fill`)
2. Upload all these files to the repo (drag and drop the folder contents)

### Step 2 — Deploy on Vercel
1. Go to vercel.com and sign in (free account)
2. Click "Add New Project"
3. Import your GitHub repository
4. Click "Deploy" — Vercel auto-detects Next.js

### Step 3 — Add your Anthropic API key
1. In Vercel, go to your project → Settings → Environment Variables
2. Add a new variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (from console.anthropic.com)
3. Click Save, then go to Deployments → click "Redeploy"

### Step 4 — Share with testers
Copy the URL Vercel gives you (e.g. `ai-form-fill.vercel.app`) and send it to testers.
Your API key stays private on the server — testers never see it.

---

## Run locally (for development)

```bash
npm install
echo "ANTHROPIC_API_KEY=your-key-here" > .env.local
npm run dev
```

Then open http://localhost:3000

---

## How it works
1. User uploads a form (JPG, PNG, or PDF)
2. AI reads the form and detects every field
3. User talks naturally — AI extracts values and fills fields in real time
4. User can export the completed form
