export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  image: string;
  approvalNumber: string;
  batchNumber: string;
  manufacturer: string;
  manufacturerAddress: string;
  productionDate: string;
  expiryDate: string;
  specification: string;
  dosage: string;
  usage: string;
  indication: string;
  barcode: string;
  authenticity: 'authentic' | 'suspected' | 'unknown';
  queryCount: number;
  lastQueryTime?: string;
  isFavorite?: boolean;
  category: string;
  recallNotice?: RecallNotice;
}

export interface RecallNotice {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  publishDate: string;
  scope: string;
}

export interface CirculationNode {
  id: string;
  type: 'manufacturer' | 'wholesaler' | 'retailer' | 'consumer';
  name: string;
  address: string;
  licenseNumber: string;
  operation: string;
  operator: string;
  time: string;
  batchNumber?: string;
  quantity?: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  avatar?: string;
  age: number;
  gender: 'male' | 'female';
  allergies?: string[];
  chronicDiseases?: string[];
}

export interface MedicineReminder {
  id: string;
  medicineId: string;
  medicineName: string;
  memberId: string;
  memberName: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate: string;
  enabled: boolean;
  notes?: string;
}

export type ReceiptType = 'invoice' | 'receipt' | 'prescription' | 'other';

export interface ReceiptItem {
  url: string;
  type: ReceiptType;
  note?: string;
}

export interface StoreRecord {
  id: string;
  storeName: string;
  storeAddress: string;
  storeLicense: string;
  storePhone: string;
  purchaseDate: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  barcode?: string;
  memberId: string;
  memberName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  prescriptionNumber?: string;
  isSplitSale: boolean;
  splitQuantity?: number;
  receiptImages?: string[];
  receipts?: ReceiptItem[];
  notes?: string;
}

export interface MedicineInventory {
  id: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  specification?: string;
  memberId: string;
  memberName: string;
  unitQuantity: number;
  remainingQuantity: number;
  threshold: number;
  lastUpdated: string;
}

export interface AbnormalReport {
  id: string;
  type: 'damage' | 'counterfeit' | 'expired' | 'other';
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  medicineId?: string;
  medicineName?: string;
  batchNumber?: string;
  storeName?: string;
  description: string;
  images: string[];
  reporterName: string;
  reporterPhone: string;
  submitTime: string;
  updateTime?: string;
  replyContent?: string;
}

export interface QueryRecord {
  id: string;
  medicineId: string;
  medicineName: string;
  barcode: string;
  batchNumber: string;
  queryTime: string;
  queryType: 'scan' | 'manual';
  authenticity: 'authentic' | 'suspected' | 'unknown';
  memberId?: string;
  memberName?: string;
}

export interface NearbyStore {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number;
  licenseNumber: string;
  rating: number;
  businessHours: string;
  type: 'chain' | 'independent' | 'hospital';
}

export type MedicationStatus = 'pending' | 'taken' | 'skipped';

export interface MedicationLog {
  id: string;
  reminderId: string;
  medicineId: string;
  medicineName: string;
  memberId: string;
  memberName: string;
  dosage: string;
  date: string;
  scheduledTime: string;
  timeIndex: number;
  status: MedicationStatus;
  updatedAt: string;
}
