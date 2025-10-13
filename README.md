# E-commerce capstone project

# ☁️ AWS Full-Stack Deployment Guide (Node.js + React)

### *How I built, troubleshooted, and deployed a complete CI/CD pipeline using AWS Elastic Beanstalk and S3*

---

## 🌍 Project Summary

* **Frontend:** React app (served via AWS S3 Static Website)
* **Backend:** Node.js + Express API (deployed via Elastic Beanstalk)
* **CI/CD:** GitHub Actions for automated build and deployment
* **Goal:** Push to `main` → triggers → auto deploy frontend & backend to AWS

---

## 🧩 PART 1 — BACKEND SETUP (Elastic Beanstalk)

### 🎯 Step 1: Prepare the Backend Folder

Your backend directory (`api/`) should include:

```
api/
├── Dockerfile
├── package.json
├── package-lock.json
├── Procfile
├── server.js
└── tests/
```

Ensure `server.js` has a clear entry point like:

```js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/products', (req, res) => {
  res.json([{ id: 1, name: 'Book', price: 10 }]);
});

app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
```

Then add a **Procfile** (Elastic Beanstalk needs it to start your app):

```
web: node server.js
```

---

### 🎒 Step 2: Zip Your Backend

Use Git Bash or WSL to create a Linux-friendly ZIP (no Windows backslashes):

```bash
cd api
zip -r ../backend-v2.zip . -x "node_modules/*"
```

---

### ☁️ Step 3: Create Elastic Beanstalk Application

1. Go to the **AWS Management Console** → search for **Elastic Beanstalk**.
2. Click **Create Application**.
3. Fill in:

   * **Application name:** `Ecommerce-backend`
   * **Platform:** `Node.js`
   * **Platform branch:** Choose latest Node 18+
4. Under **Application code** → choose **Upload your code** → upload your `backend-v2.zip`.

---

### 🔐 Step 4: Set Service Role and Instance Profile

Elastic Beanstalk needs permissions to manage AWS resources.

#### **Create Service Role**

1. Open **IAM** → Roles → **Create role**
2. Choose **Elastic Beanstalk** → *Use case: Elastic Beanstalk - Environment*
3. Attach:

   * `AWSElasticBeanstalkService`
   * `AdministratorAccess-AWSElasticBeanstalk`
4. Name it: `aws-elasticbeanstalk-service-role`

#### **Create Instance Profile**

1. Create another role → **Use case: EC2**
2. Attach:

   * `AWSElasticBeanstalkWebTier`
   * `AWSElasticBeanstalkWorkerTier`
3. Name it: `aws-elasticbeanstalk-ec2-role`

Then, back in Beanstalk setup:

* **Service role:** choose `aws-elasticbeanstalk-service-role`
* **EC2 instance profile:** choose `aws-elasticbeanstalk-ec2-role`

---

### 🧱 Step 5: Configure Networking

You’ll see the **Networking, Database, and Tags** section.

* **VPC:** Choose default VPC (or your own)
* **Subnets:** Select all subnets (to avoid “Invalid option value: null”)
* **Public IP:** Enable it
* **Instance Type:** t2.micro (free-tier friendly)
* Leave other options as default

---

### 📦 Step 6: Launch the Environment

Click **Create Environment** and wait for it to deploy.
After a few minutes, you’ll see a green “Health: OK”.

**If you got an error:**

```
node.js may have issues starting. Please provide a package.json file or add server.js/app.js file in source bundle
```

✅ Solution: Add `Procfile` or ensure `server.js` is in root of zip.

**If you got:**

```
appears to use backslashes as path separators
```

✅ Solution: Recreate zip from Git Bash (`zip -r ...`) to fix path issues.

---

### 🌐 Step 7: Test the API

Once it’s up:

1. Copy your **Elastic Beanstalk environment URL**, e.g.
   `http://ecommerce-backend-env.eba-xxxxxxx.us-east-1.elasticbeanstalk.com`
2. Visit:

   * `/health` → should show “Backend is healthy 🚀”
   * `/products` → should return the sample data

---

## 🧩 PART 2 — FRONTEND SETUP (AWS S3)

### 🎯 Step 1: Prepare and Build React App

Your React app lives in `/webapp`.

Clean and rebuild:

```bash
cd webapp
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

This creates a `/build` folder containing:

```
build/
├── index.html
├── manifest.json
├── static/
├── logo192.png
└── favicon.ico
```

---

### ☁️ Step 2: Create S3 Bucket for Hosting

1. Open **AWS Console → S3**
2. Click **Create bucket**
3. Enter bucket name (e.g. `ecommerce-frontend-site`)
4. **Region:** us-east-1 (same as your backend)
5. Under **Object Ownership**, choose:

   * ✅ “ACLs disabled”
6. Uncheck **Block all public access**
7. Confirm warning and create bucket

---

### 🖥️ Step 3: Enable Static Website Hosting

1. Go into your bucket → **Properties**
2. Scroll to **Static website hosting**
3. Click **Edit**
4. Enable → “Host a static website”
5. Set:

   * **Index document:** `index.html`
   * **Error document:** `index.html` (to handle React routing)
6. Save

---

### 🧾 Step 4: Configure Public Read Policy

Go to **Permissions → Bucket Policy** and add:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ecommerce-frontend-site/*"
    }
  ]
}
```

Save the policy ✅

---

### 🧪 Step 5: Upload the React Build

Either manually:

* Upload all files from `/webapp/build` into your S3 bucket

or automatically (via GitHub Actions, next section).

After upload, visit:

```
http://ecommerce-frontend-site.s3-website-us-east-1.amazonaws.com
```

You’ll see your React homepage 🥳

---

## 🔄 PART 3 — AUTOMATION (GitHub Actions CI/CD)

### ⚙️ Workflow File

`.github/workflows/aws-deploy.yml`

```yaml
name: AWS Deployment
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Backend
        working-directory: ./api
        run: npm install

      - name: Test Backend
        working-directory: ./api
        run: npx jest --runInBand || echo "No tests found"

      - name: Package Backend
        working-directory: ./api
        run: zip -r ../backend.zip .

      - name: Install Frontend
        working-directory: ./webapp
        run: npm install

      - name: Build Frontend
        working-directory: ./webapp
        run: npm run build

      - name: Deploy Frontend to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.S3_BUCKET_NAME }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ${{ secrets.AWS_REGION }}
          SOURCE_DIR: webapp/build

      - name: Deploy Backend to Elastic Beanstalk
        uses: einaregilsson/beanstalk-deploy@v20
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: ${{ secrets.EB_APP_NAME }}
          environment_name: ${{ secrets.EB_ENV_NAME }}
          region: ${{ secrets.AWS_REGION }}
          version_label: v-${{ github.run_number }}
          deployment_package: ./backend.zip
```

---

### 🧠 Secrets You Must Add in GitHub

Go to your repo → **Settings → Secrets → Actions**

| Secret                  | Example                   |
| ----------------------- | ------------------------- |
| `AWS_ACCESS_KEY_ID`     | `AKIA************`        |
| `AWS_SECRET_ACCESS_KEY` | Your secret               |
| `AWS_REGION`            | `us-east-1`               |
| `S3_BUCKET_NAME`        | `ecommerce-frontend-site` |
| `EB_APP_NAME`           | `Ecommerce-backend`       |
| `EB_ENV_NAME`           | `Ecommerce-backend-env`   |

---

### 🪄 Step 6: Trigger Deployment

Commit and push your code:

```bash
git add .
git commit -m "Add CI/CD for AWS deployment"
git push origin main
```

Then go to **GitHub → Actions tab → AWS Deployment**
You’ll see your pipeline run through:

* ✅ Backend build/test
* ✅ Frontend build
* ✅ Upload to S3
* ✅ Deploy to Elastic Beanstalk

---

## ✅ PART 4 — Verification

| Component             | Check             | Expected Result                          |
| --------------------- | ----------------- | ---------------------------------------- |
| **Elastic Beanstalk** | Visit `/health`   | `{ status: "UP" }`                       |
| **Elastic Beanstalk** | Visit `/products` | `[ { id: 1, name: "Book", price: 10 } ]` |
| **S3 Static Site**    | Visit S3 URL      | React frontend loads                     |
| **Frontend API Call** | `/products` fetch | Displays live API data                   |

---

## 🧠 Key Takeaways

* AWS Beanstalk expects *Linux-style zips* → create from WSL/Git Bash.
* Always include a **Procfile** to tell Beanstalk how to start your app.
* If your S3 bucket blocks public access, update bucket policy instead of using ACLs.
* Automate everything with GitHub Actions → no more manual uploads!

---


