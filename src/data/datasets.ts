import { Dataset, ColumnMetadata } from '../types';

// Helper to create sample dataset columns metadata
function getColumnsMetadata(data: Record<string, any>[]): ColumnMetadata[] {
  if (data.length === 0) return [];
  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    const values = data.map((d) => d[key]).filter((v) => v !== undefined && v !== null);
    const distinctValues = new Set(values);
    
    // Determine type
    let type: ColumnMetadata['type'] = 'text';
    const firstVal = values[0];
    if (typeof firstVal === 'number') {
      type = 'numeric';
    } else if (typeof firstVal === 'boolean') {
      type = 'boolean';
    } else if (firstVal instanceof Date || (typeof firstVal === 'string' && !isNaN(Date.parse(firstVal)) && firstVal.includes('-'))) {
      type = 'date';
    } else if (distinctValues.size <= 5) {
      type = 'categorical';
    }

    const missingCount = data.length - values.length;

    const metadata: ColumnMetadata = {
      name: key,
      type,
      missingCount,
      distinctValuesCount: distinctValues.size,
      sampleValues: Array.from(distinctValues).slice(0, 5).map(String),
    };

    if (type === 'numeric') {
      const numVals = values as number[];
      const sum = numVals.reduce((a, b) => a + b, 0);
      const mean = sum / (numVals.length || 1);
      const variance = numVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (numVals.length || 1);
      const stdDev = Math.sqrt(variance);
      metadata.mean = Math.round(mean * 100) / 100;
      metadata.stdDev = Math.round(stdDev * 100) / 100;
      metadata.min = Math.min(...numVals);
      metadata.max = Math.max(...numVals);
    }

    return metadata;
  });
}

// 1. Bathinda F&B Outlets Dataset
const rawBathindaFBData: Record<string, any>[] = [
  { outlet_id: 'FB001', name: 'Sky Garden Cafe', category: 'Cafe', area: 'Civil Lines', rating: 4.5, reviews_snap1: 120, reviews_snap2: 155, price_level: '$$', has_website: true, capacity: 60, revenue_snap1: 18.2, revenue_snap2: 24.5 },
  { outlet_id: 'FB002', name: 'Uncle Jacks Burgers', category: 'Fast Food', area: 'Model Town', rating: 4.2, reviews_snap1: 210, reviews_snap2: 235, price_level: '$', has_website: false, capacity: 35, revenue_snap1: 22.1, revenue_snap2: 25.8 },
  { outlet_id: 'FB003', name: 'Yellow Chilli', category: 'Restaurant', area: 'GT Road', rating: 4.4, reviews_snap1: 340, reviews_snap2: 395, price_level: '$$$', has_website: true, capacity: 120, revenue_snap1: 45.0, revenue_snap2: 54.2 },
  { outlet_id: 'FB004', name: 'The Beer Cafe', category: 'Bar', area: 'Civil Lines', rating: 4.1, reviews_snap1: 180, reviews_snap2: 210, price_level: '$$$', has_website: true, capacity: 80, revenue_snap1: 31.5, revenue_snap2: 38.0 },
  { outlet_id: 'FB005', name: 'Amritsari Kulcha Land', category: 'Street Food', area: 'Railway Road', rating: 4.6, reviews_snap1: 95, reviews_snap2: 140, price_level: '$', has_website: false, capacity: 20, revenue_snap1: 8.4, revenue_snap2: 12.9 },
  { outlet_id: 'FB006', name: 'Bakes & Beans', category: 'Cafe', area: 'Model Town', rating: 4.3, reviews_snap1: 150, reviews_snap2: 185, price_level: '$$', has_website: true, capacity: 45, revenue_snap1: 14.8, revenue_snap2: 19.2 },
  { outlet_id: 'FB007', name: 'Moti Mahal Delux', category: 'Restaurant', area: 'GT Road', rating: 3.9, reviews_snap1: 280, reviews_snap2: 295, price_level: '$$$', has_website: true, capacity: 100, revenue_snap1: 38.0, revenue_snap2: 40.5 },
  { outlet_id: 'FB008', name: 'Shree Krishna Bhojnalya', category: 'Restaurant', area: 'Railway Road', rating: 4.5, reviews_snap1: 410, reviews_snap2: 480, price_level: '$', has_website: false, capacity: 50, revenue_snap1: 19.5, revenue_snap2: 26.2 },
  { outlet_id: 'FB009', name: 'The Chocolate Room', category: 'Cafe', area: 'Civil Lines', rating: 4.0, reviews_snap1: 85, reviews_snap2: 105, price_level: '$$', has_website: true, capacity: 30, revenue_snap1: 9.2, revenue_snap2: 11.5 },
  { outlet_id: 'FB010', name: 'Barbeque Nation', category: 'Restaurant', area: 'Model Town', rating: 4.6, reviews_snap1: 650, reviews_snap2: 780, price_level: '$$$', has_website: true, capacity: 150, revenue_snap1: 75.0, revenue_snap2: 92.5 },
  // Duplicate of FB010 to show cleaning
  { outlet_id: 'FB010', name: 'Barbeque Nation', category: 'Restaurant', area: 'Model Town', rating: 4.6, reviews_snap1: 650, reviews_snap2: 780, price_level: '$$$', has_website: true, capacity: 150, revenue_snap1: 75.0, revenue_snap2: 92.5 },
  // Outlier row with massive capacity / revenue snap 2
  { outlet_id: 'FB011', name: 'Royal Palace Banquet & Dine', category: 'Restaurant', area: 'GT Road', rating: 4.7, reviews_snap1: 50, reviews_snap2: 70, price_level: '$$$', has_website: true, capacity: 1200, revenue_snap1: 110.0, revenue_snap2: 450.0 }, // capacity=1200 is outlier
  // Some rows with null ratings or prices to show null imputing
  { outlet_id: 'FB012', name: 'Giani Ice Cream', category: 'Street Food', area: 'Model Town', rating: null, reviews_snap1: 140, reviews_snap2: 180, price_level: '$', has_website: false, capacity: 15, revenue_snap1: 11.0, revenue_snap2: 15.1 },
  { outlet_id: 'FB013', name: 'Chawla Chicken', category: 'Restaurant', area: 'Civil Lines', rating: 4.1, reviews_snap1: 190, reviews_snap2: 215, price_level: null, has_website: true, capacity: 60, revenue_snap1: 24.0, revenue_snap2: 27.5 },
  { outlet_id: 'FB014', name: 'Hot Millions', category: 'Fast Food', area: 'GT Road', rating: 3.8, reviews_snap1: 110, reviews_snap2: 125, price_level: '$$', has_website: false, capacity: null, revenue_snap1: 15.3, revenue_snap2: 17.8 },
  { outlet_id: 'FB015', name: 'Nik Bakers', category: 'Cafe', area: 'Civil Lines', rating: 4.4, reviews_snap1: 310, reviews_snap2: 385, price_level: '$$', has_website: true, capacity: 55, revenue_snap1: 29.2, revenue_snap2: 39.4 },
  { outlet_id: 'FB016', name: 'Golgappa Junction', category: 'Street Food', area: 'Railway Road', rating: 4.2, reviews_snap1: 60, reviews_snap2: 95, price_level: '$', has_website: false, capacity: 8, revenue_snap1: 4.1, revenue_snap2: 6.9 },
  { outlet_id: 'FB017', name: 'Brewmaster', category: 'Bar', area: 'GT Road', rating: 4.3, reviews_snap1: 240, reviews_snap2: 290, price_level: '$$$', has_website: true, capacity: 90, revenue_snap1: 42.0, revenue_snap2: 52.5 },
  { outlet_id: 'FB018', name: 'Dominoes Pizza', category: 'Fast Food', area: 'Model Town', rating: 4.1, reviews_snap1: 450, reviews_snap2: 510, price_level: '$$', has_website: true, capacity: 40, revenue_snap1: 35.0, revenue_snap2: 41.2 },
  { outlet_id: 'FB019', name: 'Havmor Parlour', category: 'Street Food', area: 'Civil Lines', rating: 4.3, reviews_snap1: 75, reviews_snap2: 95, price_level: '$', has_website: false, capacity: 12, revenue_snap1: 6.8, revenue_snap2: 8.9 },
  { outlet_id: 'FB020', name: 'Sanjha Chulha dhabha', category: 'Restaurant', area: 'Railway Road', rating: 4.5, reviews_snap1: 380, reviews_snap2: 460, price_level: '$', has_website: false, capacity: 70, revenue_snap1: 28.0, revenue_snap2: 36.5 },
  { outlet_id: 'FB021', name: 'Sip N Bite', category: 'Cafe', area: 'Model Town', rating: 4.0, reviews_snap1: 115, reviews_snap2: 140, price_level: '$$', has_website: false, capacity: 25, revenue_snap1: 11.2, revenue_snap2: 14.0 },
  { outlet_id: 'FB022', name: 'Burger King', category: 'Fast Food', area: 'GT Road', rating: 4.2, reviews_snap1: 520, reviews_snap2: 590, price_level: '$$', has_website: true, capacity: 80, revenue_snap1: 45.0, revenue_snap2: 52.8 },
  { outlet_id: 'FB023', name: 'La Pinoz Pizza', category: 'Fast Food', area: 'Civil Lines', rating: 4.3, reviews_snap1: 290, reviews_snap2: 360, price_level: '$$', has_website: true, capacity: 30, revenue_snap1: 21.4, revenue_snap2: 29.5 },
  { outlet_id: 'FB024', name: 'Tea Halt', category: 'Cafe', area: 'Railway Road', rating: null, reviews_snap1: 45, reviews_snap2: 60, price_level: '$', has_website: false, capacity: 15, revenue_snap1: 3.5, revenue_snap2: 4.9 },
  { outlet_id: 'FB025', name: 'Gourmet Grill', category: 'Restaurant', area: 'Civil Lines', rating: 4.1, reviews_snap1: 130, reviews_snap2: 150, price_level: '$$$', has_website: true, capacity: 65, revenue_snap1: 22.8, revenue_snap2: 26.1 },
  { outlet_id: 'FB026', name: 'Keventers Milkshakes', category: 'Street Food', area: 'Model Town', rating: 4.2, reviews_snap1: 180, reviews_snap2: 220, price_level: '$$', has_website: true, capacity: 10, revenue_snap1: 12.5, revenue_snap2: 16.0 },
  { outlet_id: 'FB027', name: 'The Punjabi Rasoi', category: 'Restaurant', area: 'GT Road', rating: 4.4, reviews_snap1: 310, reviews_snap2: 355, price_level: '$$', has_website: false, capacity: 85, revenue_snap1: 29.0, revenue_snap2: 34.8 },
  { outlet_id: 'FB028', name: 'Cafe Coffee Day', category: 'Cafe', area: 'Model Town', rating: 3.9, reviews_snap1: 190, reviews_snap2: 215, price_level: '$$', has_website: true, capacity: 30, revenue_snap1: 14.0, revenue_snap2: 16.5 },
  { outlet_id: 'FB029', name: 'Chicking', category: 'Fast Food', area: 'Civil Lines', rating: 4.0, reviews_snap1: 105, reviews_snap2: 120, price_level: '$$', has_website: true, capacity: 45, revenue_snap1: 11.8, revenue_snap2: 13.9 },
  { outlet_id: 'FB030', name: 'Baskin Robbins', category: 'Street Food', area: 'Civil Lines', rating: 4.5, reviews_snap1: 90, reviews_snap2: 115, price_level: '$$', has_website: false, capacity: 12, revenue_snap1: 8.9, revenue_snap2: 11.8 },
];

// 2. SaaS Customer Churn Dataset
const rawSaaSData: Record<string, any>[] = [
  { customer_id: 'C1001', company_size: 150, active_users: 42, storage_gb: 120, support_tickets: 2, monthly_spend: 420, contract_months: 12, features_used: 6, churned: false },
  { customer_id: 'C1002', company_size: 18, active_users: 5, storage_gb: 25, support_tickets: 8, monthly_spend: 85, contract_months: 1, features_used: 2, churned: true },
  { customer_id: 'C1003', company_size: 450, active_users: 180, storage_gb: 850, support_tickets: 1, monthly_spend: 1250, contract_months: 24, features_used: 9, churned: false },
  { customer_id: 'C1004', company_size: 50, active_users: 15, storage_gb: 80, support_tickets: 5, monthly_spend: 180, contract_months: 6, features_used: 4, churned: true },
  { customer_id: 'C1005', company_size: 12, active_users: 3, storage_gb: 15, support_tickets: 0, monthly_spend: 45, contract_months: 1, features_used: 1, churned: false },
  { customer_id: 'C1006', company_size: 85, active_users: 28, storage_gb: 210, support_tickets: 4, monthly_spend: 320, contract_months: 12, features_used: 5, churned: false },
  { customer_id: 'C1007', company_size: 550, active_users: 220, storage_gb: 1200, support_tickets: 9, monthly_spend: 2100, contract_months: 12, features_used: 8, churned: true },
  { customer_id: 'C1008', company_size: 40, active_users: 12, storage_gb: 60, support_tickets: 12, monthly_spend: 150, contract_months: 1, features_used: 3, churned: true },
  { customer_id: 'C1009', company_size: 250, active_users: 95, storage_gb: 480, support_tickets: 3, monthly_spend: 850, contract_months: 24, features_used: 7, churned: false },
  { customer_id: 'C1010', company_size: 65, active_users: 20, storage_gb: 140, support_tickets: 1, monthly_spend: 210, contract_months: 12, features_used: 4, churned: false },
  { customer_id: 'C1011', company_size: 300, active_users: 110, storage_gb: 600, support_tickets: 14, monthly_spend: 950, contract_months: 6, features_used: 6, churned: true },
  { customer_id: 'C1012', company_size: 8, active_users: 2, storage_gb: 5, support_tickets: 1, monthly_spend: 30, contract_months: 1, features_used: 1, churned: true },
  { customer_id: 'C1013', company_size: 120, active_users: 48, storage_gb: 310, support_tickets: 4, monthly_spend: 490, contract_months: 12, features_used: 5, churned: false },
  { customer_id: 'C1014', company_size: 90, active_users: 30, storage_gb: 180, support_tickets: 6, monthly_spend: 310, contract_months: 3, features_used: 3, churned: true },
  { customer_id: 'C1015', company_size: 750, active_users: 310, storage_gb: 1900, support_tickets: 2, monthly_spend: 2800, contract_months: 24, features_used: 10, churned: false },
  { customer_id: 'C1016', company_size: 35, active_users: 8, storage_gb: 40, support_tickets: 7, monthly_spend: 110, contract_months: 1, features_used: 2, churned: true },
  { customer_id: 'C1017', company_size: 160, active_users: 60, storage_gb: 400, support_tickets: 3, monthly_spend: 580, contract_months: 12, features_used: 6, churned: false },
  { customer_id: 'C1018', company_size: 45, active_users: 14, storage_gb: 90, support_tickets: 2, monthly_spend: 160, contract_months: 12, features_used: 4, churned: false },
  { customer_id: 'C1019', company_size: 820, active_users: 380, storage_gb: 2200, support_tickets: 5, monthly_spend: 3400, contract_months: 12, features_used: 9, churned: false },
  { customer_id: 'C1020', company_size: 24, active_users: 6, storage_gb: 30, support_tickets: 5, monthly_spend: 70, contract_months: 1, features_used: 2, churned: true },
  // Some rows with missing values
  { customer_id: 'C1021', company_size: 140, active_users: null, storage_gb: 280, support_tickets: 2, monthly_spend: 440, contract_months: 12, features_used: 5, churned: false },
  { customer_id: 'C1022', company_size: null, active_users: 12, storage_gb: 100, support_tickets: 6, monthly_spend: 190, contract_months: 6, features_used: 4, churned: false },
  { customer_id: 'C1023', company_size: 380, active_users: 150, storage_gb: 750, support_tickets: null, monthly_spend: 1100, contract_months: 24, features_used: 8, churned: false },
  // Outliers
  { customer_id: 'C1024', company_size: 25, active_users: 4, storage_gb: 10, support_tickets: 45, monthly_spend: 50, contract_months: 1, features_used: 1, churned: true }, // Outlier: support_tickets = 45
  { customer_id: 'C1025', company_size: 50, active_users: 10, storage_gb: 40, support_tickets: 4, monthly_spend: 9999, contract_months: 12, features_used: 3, churned: false }, // Outlier: monthly_spend = 9999
  // Duplicate
  { customer_id: 'C1005', company_size: 12, active_users: 3, storage_gb: 15, support_tickets: 0, monthly_spend: 45, contract_months: 1, features_used: 1, churned: false },
];

// 3. Retail Sales & Marketing Spend Dataset
const rawRetailData: Record<string, any>[] = [
  { week_id: 'W01', date: '2026-01-04', stores: 5, traffic: 12000, promo: true, spend_social: 1200, spend_search: 1500, competitor_idx: 1.02, sales_k: 45.2 },
  { week_id: 'W02', date: '2026-01-11', stores: 5, traffic: 10500, promo: false, spend_social: 800, spend_search: 1000, competitor_idx: 1.05, sales_k: 38.4 },
  { week_id: 'W03', date: '2026-01-18', stores: 5, traffic: 11500, promo: false, spend_social: 1000, spend_search: 1200, competitor_idx: 1.01, sales_k: 41.1 },
  { week_id: 'W04', date: '2026-01-25', stores: 5, traffic: 14500, promo: true, spend_social: 1500, spend_search: 2000, competitor_idx: 0.98, sales_k: 56.5 },
  { week_id: 'W05', date: '2026-02-01', stores: 5, traffic: 13000, promo: true, spend_social: 1400, spend_search: 1800, competitor_idx: 0.99, sales_k: 51.0 },
  { week_id: 'W06', date: '2026-02-08', stores: 5, traffic: 11000, promo: false, spend_social: 900, spend_search: 1100, competitor_idx: 1.03, sales_k: 39.8 },
  { week_id: 'W07', date: '2026-02-15', stores: 5, traffic: 12500, promo: false, spend_social: 1100, spend_search: 1300, competitor_idx: 1.02, sales_k: 43.5 },
  { week_id: 'W08', date: '2026-02-22', stores: 5, traffic: 15500, promo: true, spend_social: 2200, spend_search: 2500, competitor_idx: 0.95, sales_k: 64.2 },
  { week_id: 'W09', date: '2026-03-01', stores: 5, traffic: 14000, promo: true, spend_social: 1800, spend_search: 2200, competitor_idx: 0.96, sales_k: 58.0 },
  { week_id: 'W10', date: '2026-03-08', stores: 6, traffic: 16500, promo: true, spend_social: 2000, spend_search: 2400, competitor_idx: 0.97, sales_k: 68.9 },
  { week_id: 'W11', date: '2026-03-15', stores: 6, traffic: 15000, promo: false, spend_social: 1300, spend_search: 1600, competitor_idx: 1.01, sales_k: 58.2 },
  { week_id: 'W12', date: '2026-03-22', stores: 6, traffic: 15800, promo: false, spend_social: 1400, spend_search: 1700, competitor_idx: 1.00, sales_k: 60.5 },
  { week_id: 'W13', date: '2026-03-29', stores: 6, traffic: 18500, promo: true, spend_social: 2800, spend_search: 3000, competitor_idx: 0.94, sales_k: 79.4 },
  { week_id: 'W14', date: '2026-04-05', stores: 6, traffic: 17000, promo: true, spend_social: 2400, spend_search: 2600, competitor_idx: 0.95, sales_k: 71.1 },
  { week_id: 'W15', date: '2026-04-12', stores: 6, traffic: 14800, promo: false, spend_social: 1500, spend_search: 1800, competitor_idx: 1.01, sales_k: 57.8 },
  { week_id: 'W16', date: '2026-04-19', stores: 6, traffic: 15200, promo: false, spend_social: 1600, spend_search: 1900, competitor_idx: 1.02, sales_k: 59.1 },
  { week_id: 'W17', date: '2026-04-26', stores: 6, traffic: 19800, promo: true, spend_social: 3200, spend_search: 3500, competitor_idx: 0.91, sales_k: 88.5 },
  { week_id: 'W18', date: '2026-05-03', stores: 7, traffic: 22000, promo: true, spend_social: 3500, spend_search: 4000, competitor_idx: 0.90, sales_k: 98.2 },
  { week_id: 'W19', date: '2026-05-10', stores: 7, traffic: 19500, promo: false, spend_social: 2000, spend_search: 2500, competitor_idx: 0.97, sales_k: 82.4 },
  { week_id: 'W20', date: '2026-05-17', stores: 7, traffic: 20500, promo: false, spend_social: 2200, spend_search: 2700, competitor_idx: 0.96, sales_k: 85.9 },
  // Missing values
  { week_id: 'W21', date: '2026-05-24', stores: 7, traffic: null, promo: true, spend_social: 3000, spend_search: 3200, competitor_idx: 0.93, sales_k: 92.0 },
  { week_id: 'W22', date: '2026-05-31', stores: 7, traffic: 21000, promo: null, spend_social: 2400, spend_search: 2800, competitor_idx: 0.95, sales_k: 86.4 },
  { week_id: 'W23', date: '2026-06-07', stores: 7, traffic: 21500, promo: false, spend_social: null, spend_search: 2900, competitor_idx: 0.97, sales_k: 84.1 },
  // Outlier
  { week_id: 'W24', date: '2026-06-14', stores: 7, traffic: 22000, promo: true, spend_social: 3200, spend_search: 3400, competitor_idx: 0.94, sales_k: 875.0 }, // Massive sales outlier 875k vs typical ~80k
  // Duplicate
  { week_id: 'W05', date: '2026-02-01', stores: 5, traffic: 13000, promo: true, spend_social: 1400, spend_search: 1800, competitor_idx: 0.99, sales_k: 51.0 },
];

export const defaultDatasets: Dataset[] = [
  {
    id: 'bathinda_fb',
    name: 'Bathinda F&B Outlets',
    description: 'Historical growth, revenue, rating, capacity, and website data for F&B establishments in Bathinda. Built with Snapshot 1 and Snapshot 2 to model local food-service growth vectors.',
    category: 'F&B Sector',
    rowCount: rawBathindaFBData.length,
    columnCount: Object.keys(rawBathindaFBData[0]).length,
    columns: getColumnsMetadata(rawBathindaFBData),
    rawData: rawBathindaFBData,
  },
  {
    id: 'saas_churn',
    name: 'SaaS Customer Usage & Churn',
    description: 'Enterprise and mid-market customer usage patterns, license sizes, support ticket frequency, and contract status. Highly effective for predicting and minimizing customer churn (Classification).',
    category: 'Software-as-a-Service',
    rowCount: rawSaaSData.length,
    columnCount: Object.keys(rawSaaSData[0]).length,
    columns: getColumnsMetadata(rawSaaSData),
    rawData: rawSaaSData,
  },
  {
    id: 'retail_sales',
    name: 'Retail Weekly Performance',
    description: 'Weekly sales metrics, store expansions, foot traffic levels, competitor price indexing, and multi-channel marketing spends (Social vs. Search) for budget optimization (Regression).',
    category: 'Retail & Marketing',
    rowCount: rawRetailData.length,
    columnCount: Object.keys(rawRetailData[0]).length,
    columns: getColumnsMetadata(rawRetailData),
    rawData: rawRetailData,
  },
];
