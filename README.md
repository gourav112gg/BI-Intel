# BI-Intel: Predictive Analytics Decision Suite

BI-Intel is a premium, high-fidelity web application built for machine learning data analysis, preprocessing, and predictive model coaching. Featuring fluid scroll performance, stunning staggered micro-animations, and full device responsiveness, BI-Intel enables users to upload custom datasets, profile column types, impute missing values, cap statistical outliers, and fit ML model equations in real time.

---

## 🌟 Key Features

* **Ingest & Profile**: Preview and inspect data column types, distinct values, and statistical properties.
* **Interactive Data Cleaning**: Impute null values using mean, median, mode, zero, or row dropping; check duplicates; and apply outlier capping dynamically.
* **Real-time ML Trainer**: Select targets and predictor variables, tune validation split ratios and hyperparameters (learning rate, iterations, tree depth), and train Linear Regression, Logistic Regression, or Decision Tree models.
* **Performance Dashboard**: Audit model fit metrics (R², MAE, RMSE, Accuracy, F1-Score, Precision, Recall) with interactive validation line plots and fitted feature coefficient magnitudes.
* **Automated Strategic Brief**: Instantly generates automated data analysis, executive summaries, data quality observations, and business recommendation checklists locally based on your trained model results (no API keys needed!).
* **Executive PDF Export**: Compile the strategic brief into a printable PDF report for executives.
* **Smooth Inertial Scrolling**: Implements Lenis scroll interpolation.
* **Fluid Page Transitions**: Cross-fading workspace tabs using Framer Motion `<AnimatePresence>`.

---

## ⚙️ Environment Configuration

To run the application locally, you must create a `.env` file in the root directory. The application operates 100% locally and requires no external API keys.

Refer to [.env.example](.env.example) for reference:

```env
# Application host URL
APP_URL=http://localhost:3000
```

---

## 🚀 Getting Started

### 📋 Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or another package manager

### 📥 Installation
1. Clone the project or navigate to the workspace directory.
2. Install the application dependencies:
   ```bash
   npm install
   ```

### 🛠️ Running the Application
To launch both the client development server and the Express backend:
```bash
npm run dev
```
The server will boot and serve the client at `http://localhost:3000`.

### 📦 Building for Production
To bundle the frontend assets and compile the server-side source:
```bash
npm run build
```
