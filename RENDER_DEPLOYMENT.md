# Render Deployment Guide for Snake Rivals Arena

This guide will walk you through deploying Snake Rivals Arena to Render.com with their free tier.

## Prerequisites

- GitHub account
- Render account (sign up at https://render.com)
- Your code pushed to a GitHub repository

## Deployment Steps

### Step 1: Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/snake-rivals-arena.git

# Push to GitHub
git push -u origin main
```

### Step 2: Create a Render Account

1. Go to https://render.com
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### Step 3: Deploy Using Blueprint (Automated)

Render will automatically detect the `render.yaml` file and set up everything:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Blueprint"**
3. **Connect your repository**: Select `snake-rivals-arena`
4. **Review the blueprint**: Render will show:
   - Web Service: `snake-rivals-arena`
   - PostgreSQL Database: `snake-rivals-db`
5. **Click "Apply"**

Render will now:
- Create a PostgreSQL database
- Build your Docker container
- Deploy your application
- Set up automatic deployments on git push

### Step 4: Wait for Deployment

The initial deployment takes 5-10 minutes:
- Database provisioning: ~2 minutes
- Docker build: ~3-5 minutes
- Deployment: ~1-2 minutes

You can watch the build logs in real-time on the Render dashboard.

### Step 5: Access Your Application

Once deployed, Render provides a URL like:
```
https://snake-rivals-arena.onrender.com
```

Your app is now live! 🎉

## Alternative: Manual Setup

If you prefer to set up manually instead of using the blueprint:

### 1. Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `snake-rivals-db`
   - **Database**: `snake_rivals`
   - **User**: `snake_user`
   - **Region**: Choose closest to you
   - **Plan**: Free
3. Click **"Create Database"**
4. Copy the **Internal Database URL** (starts with `postgresql://`)

### 2. Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `snake-rivals-arena`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free
4. Add Environment Variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the Internal Database URL from step 1
5. Click **"Create Web Service"**

## Configuration Details

### Environment Variables

Render automatically sets:
- `PORT`: 10000 (Render's default, but we use 8000 in Dockerfile)
- `DATABASE_URL`: Connection string to PostgreSQL

### Health Checks

Render will ping `/api/` to verify your app is running.

### Auto-Deploy

Every push to your `main` branch triggers automatic deployment.

## Free Tier Limitations

Render's free tier includes:

**Web Service:**
- ✅ 512 MB RAM
- ✅ Shared CPU
- ✅ Automatic HTTPS
- ⚠️ **Spins down after 15 minutes of inactivity**
- ⚠️ Cold start takes ~30 seconds

**PostgreSQL:**
- ✅ 1 GB storage
- ✅ Shared instance
- ⚠️ **Expires after 90 days** (need to recreate)
- ⚠️ No automatic backups

### Handling Cold Starts

Your app will "sleep" after 15 minutes of no traffic. First request after sleep takes ~30 seconds.

**Solutions:**
1. **Upgrade to paid plan** ($7/month - no sleep)
2. **Use a ping service** (e.g., UptimeRobot) to keep it awake
3. **Accept the cold starts** (fine for demos/portfolios)

## Upgrading to Paid Plan

For production use, consider upgrading:

**Starter Plan ($7/month per service):**
- No sleep/cold starts
- More resources
- Better performance

**PostgreSQL Standard ($7/month):**
- 10 GB storage
- No expiration
- Automatic backups
- Better performance

## Custom Domain

To use your own domain:

1. Go to your web service settings
2. Click **"Custom Domain"**
3. Add your domain (e.g., `snakearena.com`)
4. Update your DNS records as instructed
5. Render automatically provisions SSL certificate

## Monitoring & Logs

### View Logs

1. Go to your web service
2. Click **"Logs"** tab
3. See real-time application logs

### Metrics

1. Click **"Metrics"** tab
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

## Database Management

### Connect to Database

Use the **External Database URL** from Render dashboard:

```bash
psql postgresql://snake_user:PASSWORD@HOST/snake_rivals
```

### Backup Database

```bash
# Get the external connection URL from Render dashboard
pg_dump "postgresql://snake_user:PASSWORD@HOST/snake_rivals" > backup.sql
```

### Restore Database

```bash
psql "postgresql://snake_user:PASSWORD@HOST/snake_rivals" < backup.sql
```

## Troubleshooting

### Build Fails

Check build logs for errors:
- Missing dependencies
- Dockerfile syntax errors
- Out of memory during build

### App Won't Start

Common issues:
- Database connection string incorrect
- Port configuration mismatch
- Missing environment variables

### Database Connection Errors

Verify:
- `DATABASE_URL` is set correctly
- Database is in same region as web service
- Using **Internal Database URL** (not External)

### Slow Performance

Free tier limitations:
- Shared resources
- Cold starts
- Limited RAM

Consider upgrading to paid plan.

## Updating Your App

Simply push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push
```

Render automatically:
1. Detects the push
2. Builds new Docker image
3. Deploys with zero downtime
4. Rolls back if deployment fails

## Cost Estimation

**Free Tier:**
- Web Service: $0
- PostgreSQL: $0
- **Total: $0/month** (with limitations)

**Production Ready:**
- Web Service (Starter): $7/month
- PostgreSQL (Standard): $7/month
- **Total: $14/month**

## Next Steps

After deployment:

1. ✅ Test your live application
2. ✅ Set up custom domain (optional)
3. ✅ Configure monitoring/alerts
4. ✅ Set up database backups
5. ✅ Consider upgrading for production use

## Support

- **Render Docs**: https://render.com/docs
- **Community**: https://community.render.com
- **Status**: https://status.render.com

---

Your Snake Rivals Arena app is now deployed to the cloud! 🚀
