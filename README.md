# FORENSIC — Deterministic Evidence-Controlled Legal AI

A litigation operating system with immutable evidence vaults, forensic fact ledgers, and deterministic chronology engines — designed for court-facing deployment. Every fact is traceable to its source. Every citation is verifiable. Every output is auditable.

## What's Included

- **Animated SVG Connectome Hero** — Full-viewport forensic evidence network with traveling signal paths
- **Document Vault** — Drag-and-drop upload with visual processing pipeline (8 stages: Upload → Hash → Vault → OCR → Extract → Classify → Ledger → Complete)
- **System Overview** — Canvas-animated evidence pipeline with stat cards
- **Principles Section** — Five governing principles of deterministic legal AI
- **Architecture Section** — ASCII art connectome of the 5 canonical layers
- **Engines Section** — 14+ specialized forensic engines with category badges
- **Audit & Validation** — Authority verification matrix with scrolling ASCII art
- **Implementation Timeline** — 6-phase deployment roadmap
- **MachineBot** — Terminal-style system interpreter with comprehensive knowledge base
- **Text-to-Speech** — Web Speech API integration (read aloud on bot messages and document facts)

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- GSAP + ScrollTrigger for animations
- Lenis for smooth scrolling
- Web Speech API for TTS (free, no API keys)
- Geist Sans & Geist Mono typography

## Cost to Run

**£0/month** — entirely client-side, no backend servers, no API keys, no database.

## Quick Start (Local Development)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/forensic-legal-ai.git
cd forensic-legal-ai

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
```

## Deploy to GitHub Pages (Auto-deploy on every push)

### Step 1 — Create the repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `forensic-legal-ai`
3. Visibility: **Public** (required for free GitHub Pages)
4. Do NOT initialize with README (we already have one)
5. Click **"Create repository"**

### Step 2 — Push the code

```bash
# From your project directory
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/forensic-legal-ai.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages

1. On your repo page, go to **Settings → Pages**
2. **Source**: Select "GitHub Actions"
3. That's it — the workflow file (`.github/workflows/deploy.yml`) is already in your repo

### Step 4 — First deployment

1. Go to **Actions** tab on your repo
2. You should see the "Deploy to GitHub Pages" workflow running
3. Wait for it to turn green ✅ (takes ~2 minutes)
4. Go back to **Settings → Pages** to see your live URL

Your site will be at: `https://YOUR_USERNAME.github.io/forensic-legal-ai/`

### Step 5 — Auto-deploy forever

From now on, every time you push to the `main` branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

...the site will automatically rebuild and redeploy. Check the **Actions** tab to watch it happen.

---

## Deploy to Other Platforms

### Netlify (Drag & Drop — 30 seconds)

1. Run `npm run build` locally
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist/` folder onto the page
4. Done — instant URL

### Vercel (Git-connected)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → "New Project"
3. Import your repo
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Framework: **Vite**
7. Deploy

### Cloudflare Pages

1. Push code to GitHub
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Pages
3. Connect your GitHub repo
4. Build command: `npm run build`
5. Build output: `dist`
6. Deploy

### Hugging Face Spaces (Static)

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) → "Create new Space"
2. SDK: **Static**
3. Clone your space:
   ```bash
   git clone https://huggingface.co/spaces/YOUR_USERNAME/forensic-legal-ai
   cd forensic-legal-ai
   ```
4. Build locally, then copy files:
   ```bash
   cd /path/to/your/project
   npm run build
   cp -r dist/* /path/to/your/space/
   ```
5. Push:
   ```bash
   cd /path/to/your/space
   git add .
   git commit -m "Deploy"
   git push
   ```

---

## Project Structure

```
forensic-legal-ai/
├── .github/workflows/deploy.yml    # GitHub Actions CI/CD
├── public/                          # Static assets
│   ├── img-1.jpg                   # Blueprint texture
│   ├── img-2.png                   # Legal tech icons
│   ├── img-3.jpg                   # Archive room photo
│   └── img-4.jpg                   # Evidence graph
├── src/
│   ├── sections/                    # Page sections
│   │   ├── Navigation.tsx          # Fixed top nav
│   │   ├── Hero.tsx                # SVG connectome hero
│   │   ├── DocumentVault.tsx       # Upload & processing
│   │   ├── VideoShowcase.tsx       # Pipeline visualization
│   │   ├── Principles.tsx          # Governing principles
│   │   ├── Architecture.tsx        # ASCII connectome
│   │   ├── Engines.tsx             # 14+ engine cards
│   │   ├── Audit.tsx               # Verification matrix
│   │   ├── Timeline.tsx            # 6-phase roadmap
│   │   ├── CTA.tsx                 # Call to action
│   │   ├── Footer.tsx              # Page footer
│   │   └── MachineBot.tsx          # System interpreter
│   ├── hooks/
│   │   └── useTTS.ts               # Text-to-speech hook
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind theme
└── package.json
```

## Architecture Overview

The system implements a **deterministic evidence pipeline** with five canonical layers:

1. **Evidence Vault** — Immutable storage with SHA-256 hashing, WORM, RFC 3161 timestamps
2. **Fact Ledger** — Atomic litigable facts, source-bound, never auto-promoted
3. **Legal Mapping Engine** — Versioned authorities, stale-guidance alerts
4. **Drafting Engine** — Court-ready documents from controlled records only
5. **Audit Engine** — Zero critical findings required for export

Plus 14+ specialized engines: Burden of Proof, Admission Engine, Chronology Integrity, Quote Preservation, Hallucination Detector, Legal Authority Engine, Contradiction Ranking, Judge Mode, Procedural Engine, and more.

## License

Apache 2.0
