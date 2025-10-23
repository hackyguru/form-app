# Deploying to Vercel

## Yes! Your App is Vercel-Ready ✅

Your form application with Storacha/IPFS integration works perfectly on Vercel because:

- ✅ Next.js is built by Vercel (optimal support)
- ✅ API routes become serverless functions automatically
- ✅ Environment variables are securely stored
- ✅ No database or persistent backend needed
- ✅ IPFS handles all form storage

## Quick Deployment

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add Storacha/IPFS integration"
   git push origin master
   ```

2. **Go to Vercel**
   - Visit https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - In project settings, go to "Environment Variables"
   - Add these two variables:
     ```
     STORACHA_KEY=Mg...
     STORACHA_PROOF=...
     ```
   - Apply to: Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes
   - Your app is live! 🎉

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts, then set environment variables:
vercel env add STORACHA_KEY
vercel env add STORACHA_PROOF

# Deploy to production
vercel --prod
```

## Environment Variables Setup

### In Vercel Dashboard

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable:

```
Name: STORACHA_KEY
Value: MgCZT5YJF... (your actual key from storacha key create)
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: STORACHA_PROOF
Value: uOqJlcm9v... (your actual proof from storacha delegation create)
Environments: ✓ Production ✓ Preview ✓ Development
```

4. **Redeploy** after adding variables (Vercel will prompt you)

### Security Note

- ⚠️ Never commit `.env.local` to git
- ✅ Use Vercel's environment variables dashboard
- ✅ Variables are encrypted at rest
- ✅ Only accessible during build/runtime

## Vercel Configuration

Your project already has the right structure. Optionally, create `vercel.json` for advanced settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_VERCEL_URL": "auto"
  }
}
```

This is **optional** - Vercel auto-detects Next.js projects.

## Build Settings (Auto-Configured)

Vercel automatically detects:
- **Framework:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** From `package.json` engines or latest LTS

## Post-Deployment Steps

### 1. Test Your Deployment

Visit your Vercel URL (e.g., `https://your-app.vercel.app`)

- Create a form
- Check if it uploads to IPFS
- Verify you get a CID
- Test the form view at `/forms/view/{cid}`

### 2. Check API Route

Your delegation endpoint should work at:
```
https://your-app.vercel.app/api/storacha/delegation
```

Test it:
```bash
curl -X POST https://your-app.vercel.app/api/storacha/delegation \
  -H "Content-Type: application/json" \
  -d '{"did":"did:key:z6MkrZ..."}'
```

### 3. Monitor Logs

In Vercel dashboard:
- Go to "Deployments" → Click your deployment
- View "Runtime Logs" for API calls
- Check for errors in Storacha delegation

## Custom Domain (Optional)

### Add Your Domain

1. Go to Project Settings → Domains
2. Add your domain (e.g., `myforms.com`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (~5 minutes)

### Update CORS (if needed)

If you have CORS issues, update your API routes:

```typescript
// pages/api/storacha/delegation.ts
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // ... rest of your code
}
```

## Performance Optimization

### 1. Edge Runtime (Optional)

For faster global performance, use Edge Runtime:

```typescript
// pages/api/storacha/delegation.ts
export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  // Convert to edge-compatible handler
}
```

### 2. ISR for Form Pages

Enable Incremental Static Regeneration for cached form views:

```typescript
// pages/forms/view/[cid]/index.tsx
export async function getStaticProps({ params }) {
  const cid = params.cid;
  const formData = await getFormFromIPFS(cid);
  
  return {
    props: { formData },
    revalidate: 3600, // Revalidate every hour
  }
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  }
}
```

### 3. Caching Strategy

Add cache headers to API routes:

```typescript
res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
```

## Monitoring & Debugging

### View Logs

```bash
# Via CLI
vercel logs your-app

# Or in dashboard
Project → Deployments → [Select deployment] → Runtime Logs
```

### Common Issues & Solutions

#### 1. "Module not found" errors

**Cause:** Missing dependencies in production

**Fix:**
```bash
# Ensure all dependencies are in dependencies, not devDependencies
npm install @storacha/client --save
```

Then redeploy.

#### 2. "Environment variables not found"

**Cause:** Variables not set or not applied to right environment

**Fix:**
- Check Project Settings → Environment Variables
- Ensure applied to "Production"
- Redeploy after adding variables

#### 3. "Failed to create delegation"

**Cause:** Invalid `STORACHA_KEY` or `STORACHA_PROOF`

**Fix:**
- Verify values in Vercel dashboard (click "Reveal" to check)
- Regenerate credentials if needed
- Update in Vercel and redeploy

#### 4. "Serverless Function Timeout"

**Cause:** IPFS upload taking too long (>10s default)

**Fix:**
Add to `vercel.json`:
```json
{
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### 5. "Forms not loading from IPFS"

**Cause:** IPFS gateway slow or unavailable

**Fix:**
- Implement gateway fallbacks
- Add loading states
- Consider caching with Vercel KV

## Cost Estimation

### Vercel Pricing (as of 2025)

**Hobby Plan (Free):**
- ✅ Perfect for this app!
- Unlimited deployments
- 100GB bandwidth/month
- Serverless function invocations included
- Custom domains (1 included)

**Pro Plan ($20/month):**
- 1TB bandwidth
- More concurrent builds
- Team collaboration
- Analytics

**Cost for Your App:**
- **Vercel:** Free (Hobby) or $20/month (Pro)
- **Storacha:** Free tier (5GB storage)
- **Total:** $0 - $20/month

### What Uses Bandwidth?

- Form views from IPFS: ~1-5KB per view
- Static assets: ~500KB per page load
- API calls: ~1KB per delegation

**Example:** 
- 10,000 form views/month = ~50MB
- 1,000 page loads = ~500MB
- **Total:** ~550MB/month (well within free tier!)

## Scaling Considerations

### Current Setup Scales to:
- ✅ 100,000+ forms
- ✅ 1M+ form views/month
- ✅ Automatic global CDN
- ✅ No database to maintain

### When to Upgrade:
- Need analytics/metrics → Add Vercel Analytics
- Need faster IPFS → Pin popular forms
- Need team access → Upgrade to Pro

## CI/CD Pipeline

Vercel automatically sets up CI/CD:

1. **Push to GitHub** → Automatic deploy
2. **Pull Request** → Preview deployment
3. **Merge to main** → Production deployment

### Preview Deployments

Every pull request gets a unique URL:
```
https://your-app-git-feature-branch.vercel.app
```

Perfect for testing before production!

## Production Checklist

Before going live:

- [ ] Environment variables set in Vercel
- [ ] Tested form creation with real Storacha account
- [ ] Verified IPFS uploads work
- [ ] Checked API route `/api/storacha/delegation`
- [ ] Tested form views at `/forms/view/{cid}`
- [ ] Added custom domain (optional)
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Reviewed security settings
- [ ] Tested on mobile devices
- [ ] Checked lighthouse scores

## Security Best Practices

### 1. Rate Limiting

Add rate limiting to prevent abuse:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// pages/api/storacha/delegation.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

export default async function handler(req, res) {
  const identifier = req.headers['x-forwarded-for'] || 'anonymous';
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  // ... rest of handler
}
```

### 2. CORS Configuration

Restrict API access to your domain:

```typescript
const allowedOrigins = [
  'https://your-app.vercel.app',
  'https://yourdomain.com',
];

const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

### 3. Input Validation

Validate DID format:

```typescript
if (!did || !did.startsWith('did:key:')) {
  return res.status(400).json({ error: 'Invalid DID format' });
}
```

## Monitoring & Analytics

### Built-in Vercel Analytics

Enable in dashboard:
- Project Settings → Analytics → Enable

Tracks:
- Page views
- Real user metrics
- Core Web Vitals

### Custom Monitoring

Add Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
});
```

## Backup Strategy

### Your Data on IPFS

Good news: IPFS is permanent!
- Forms stored on decentralized network
- Multiple nodes have copies
- CIDs never change
- Can't be deleted

### Backup CID Mappings

Users' localStorage stores CID mappings. For production:

1. **Option A:** Store mappings on-chain
2. **Option B:** Use Vercel KV for backup
3. **Option C:** Export as JSON periodically

## Alternative Deployment Options

### Why Vercel is Best for This App:

✅ Zero-config Next.js support
✅ Automatic HTTPS
✅ Global CDN
✅ Free tier generous
✅ Fast cold starts

### Other Options:

1. **Netlify** - Similar to Vercel, works great
2. **Railway** - Good for traditional backends
3. **Fly.io** - Better for stateful apps
4. **Self-hosted** - More control, more work

But **Vercel is recommended** for Next.js!

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel Discord:** https://discord.gg/vercel
- **Status Page:** https://vercel-status.com

## Quick Start Commands

```bash
# Development
npm run dev

# Build (test locally)
npm run build
npm start

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# Check deployment logs
vercel logs
```

---

**Your app is production-ready! 🚀 Deploy with confidence!**
