# 🚀 Quick Deploy to Render

## 3-Step Deployment

### 1️⃣ Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2️⃣ Deploy on Render
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Select your `snake-rivals-arena` repository
4. Click **"Apply"**

### 3️⃣ Wait & Access
- Build time: ~5-10 minutes
- You'll get a URL like: `https://snake-rivals-arena.onrender.com`
- Done! 🎉

## What Render Does Automatically

✅ Creates PostgreSQL database  
✅ Builds your Docker container  
✅ Deploys your application  
✅ Provides HTTPS/SSL  
✅ Sets up auto-deploy on git push  

## Free Tier Limits

⚠️ **Web Service:**
- Spins down after 15 min of inactivity
- Cold start: ~30 seconds on first request

⚠️ **Database:**
- 1 GB storage
- Expires after 90 days (need to recreate)

💡 **Tip:** Upgrade to paid plan ($14/month) for production use

## Useful Commands

**View logs:**
```bash
# Go to Render dashboard → Your service → Logs tab
```

**Connect to database:**
```bash
# Get connection string from Render dashboard
psql "postgresql://user:password@host/snake_rivals"
```

**Trigger manual deploy:**
```bash
# Go to Render dashboard → Your service → Manual Deploy
```

## Need Help?

📖 Full guide: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)  
🏠 Render docs: https://render.com/docs  
💬 Community: https://community.render.com

---

**Cost:** $0 (free tier) or $14/month (production ready)
