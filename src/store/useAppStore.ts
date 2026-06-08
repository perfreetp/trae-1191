import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  Medicine,
  QueryRecord,
  FamilyMember,
  MedicineReminder,
  StoreRecord,
  AbnormalReport,
  CirculationNode,
  NearbyStore,
  MedicationLog,
  MedicationStatus,
} from '@/types';

const STORAGE_KEY = 'medicine_trace_app_state_v1';

interface PersistedState {
  currentMemberId: string;
  familyMembers: FamilyMember[];
  favorites: string[];
  queryRecords: QueryRecord[];
  storeRecords: StoreRecord[];
  reports: AbnormalReport[];
  reminders: MedicineReminder[];
  medicationLogs: MedicationLog[];
  activeMedicineTab?: 'reminders' | 'favorites' | 'recalls';
}

interface AppState extends PersistedState {
  draftStoreRecord: Partial<StoreRecord> | null;
  setCurrentMemberId: (id: string) => void;
  setActiveMedicineTab: (tab: 'reminders' | 'favorites' | 'recalls') => void;
  toggleFavorite: (medicineId: string) => void;
  addQueryRecord: (record: QueryRecord) => void;
  addStoreRecord: (record: StoreRecord) => void;
  setDraftStoreRecord: (draft: Partial<StoreRecord> | null) => void;
  consumeDraftStoreRecord: () => Partial<StoreRecord> | null;
  addReport: (report: AbnormalReport) => void;
  addReminder: (reminder: MedicineReminder) => void;
  toggleReminder: (id: string) => void;
  markMedication: (
    reminderId: string,
    date: string,
    timeIndex: number,
    status: MedicationStatus,
    info?: Partial<{ medicineName: string; medicineId: string; memberId: string; memberName: string; dosage: string; scheduledTime: string }>
  ) => void;
  addFamilyMember: (member: FamilyMember) => void;
  getBarcodeQueryInfo: (barcode: string) => { count: number; lastTime: string | null };
  _hydrated: boolean;
  persist: () => void;
}

const defaultFamilyMembers: FamilyMember[] = [
  { id: '1', name: '本人', relation: '自己', age: 30, gender: 'male' },
  { id: '2', name: '妈妈', relation: '母亲', age: 58, gender: 'female', chronicDiseases: ['高血压'] },
  { id: '3', name: '爸爸', relation: '父亲', age: 60, gender: 'male', allergies: ['青霉素'] },
];

const defaultQueryRecords: QueryRecord[] = [
  {
    id: 'qr1',
    medicineId: 'med1',
    medicineName: '布洛芬缓释胶囊',
    barcode: '8123456789012',
    batchNumber: '20240501A',
    queryTime: '2026-06-08 14:30',
    queryType: 'scan',
    authenticity: 'authentic',
    memberId: '1',
    memberName: '本人',
  },
  {
    id: 'qr2',
    medicineId: 'med2',
    medicineName: '阿莫西林胶囊',
    barcode: '8123456789023',
    batchNumber: '20240315B',
    queryTime: '2026-06-07 09:15',
    queryType: 'scan',
    authenticity: 'authentic',
    memberId: '2',
    memberName: '妈妈',
  },
];

const defaultStoreRecords: StoreRecord[] = [
  {
    id: 'sr1',
    storeName: '老百姓大药房(朝阳店)',
    storeAddress: '北京市朝阳区建国路88号',
    storeLicense: '京DA20200001',
    storePhone: '010-12345678',
    purchaseDate: '2026-06-08',
    medicineId: 'med1',
    medicineName: '布洛芬缓释胶囊',
    batchNumber: '20240501A',
    quantity: 2,
    unitPrice: 28.5,
    totalPrice: 57,
    isSplitSale: false,
  },
];

const defaultReports: AbnormalReport[] = [
  {
    id: 'rpt1',
    type: 'damage',
    status: 'processing',
    medicineName: '感冒灵颗粒',
    batchNumber: '20240210C',
    storeName: '益丰大药房',
    description: '外包装盒有明显压痕和破损，内部药板铝箔有少量开裂',
    images: [],
    reporterName: '张先生',
    reporterPhone: '138****8888',
    submitTime: '2026-06-06 10:20',
    updateTime: '2026-06-06 15:30',
    replyContent: '已收到您的反馈，正在联系门店核实情况',
  },
];

const defaultReminders: MedicineReminder[] = [
  {
    id: 'rmd1',
    medicineId: 'med2',
    medicineName: '阿莫西林胶囊',
    memberId: '2',
    memberName: '妈妈',
    dosage: '0.25g(1粒)',
    frequency: '每日3次',
    times: ['08:00', '14:00', '20:00'],
    startDate: '2026-06-07',
    endDate: '2026-06-13',
    enabled: true,
    notes: '饭后服用',
  },
];

const loadState = (): Partial<PersistedState> => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed || {};
    }
  } catch (e) {
    console.warn('[Store] load state failed:', e);
  }
  return {};
};

const saveState = (state: PersistedState) => {
  try {
    const toSave: PersistedState = {
      currentMemberId: state.currentMemberId,
      familyMembers: state.familyMembers,
      favorites: state.favorites,
      queryRecords: state.queryRecords,
      storeRecords: state.storeRecords,
      reports: state.reports,
      reminders: state.reminders,
      medicationLogs: state.medicationLogs,
      activeMedicineTab: state.activeMedicineTab,
    };
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('[Store] save state failed:', e);
  }
};

export const useAppStore = create<AppState>((set, get) => {
  const loaded = loadState();

  const initial: PersistedState = {
    currentMemberId: loaded.currentMemberId || '1',
    familyMembers: loaded.familyMembers?.length ? loaded.familyMembers : defaultFamilyMembers,
    favorites: loaded.favorites || [],
    queryRecords: loaded.queryRecords?.length ? loaded.queryRecords : defaultQueryRecords,
    storeRecords: loaded.storeRecords?.length ? loaded.storeRecords : defaultStoreRecords,
    reports: loaded.reports?.length ? loaded.reports : defaultReports,
    reminders: loaded.reminders?.length ? loaded.reminders : defaultReminders,
    medicationLogs: loaded.medicationLogs?.length ? loaded.medicationLogs : [],
    activeMedicineTab: loaded.activeMedicineTab || 'reminders',
  };

  return {
    ...initial,
    draftStoreRecord: null,
    _hydrated: true,

    persist: () => {
      saveState(get() as PersistedState);
    },

    setDraftStoreRecord: (draft) => {
      set({ draftStoreRecord: draft });
    },

    consumeDraftStoreRecord: () => {
      const d = get().draftStoreRecord;
      set({ draftStoreRecord: null });
      return d;
    },

    setCurrentMemberId: (id) => {
      set({ currentMemberId: id });
      get().persist();
    },

    setActiveMedicineTab: (tab) => {
      set({ activeMedicineTab: tab });
      get().persist();
    },

    toggleFavorite: (medicineId) => {
      const { favorites } = get();
      const next = favorites.includes(medicineId)
        ? favorites.filter((id) => id !== medicineId)
        : [...favorites, medicineId];
      set({ favorites: next });
      get().persist();
    },

    addQueryRecord: (record) => {
      set((state) => ({ queryRecords: [record, ...state.queryRecords] }));
      get().persist();
    },

    addStoreRecord: (record) => {
      set((state) => ({ storeRecords: [record, ...state.storeRecords] }));
      get().persist();
    },

    addReport: (report) => {
      set((state) => ({ reports: [report, ...state.reports] }));
      get().persist();
    },

    addReminder: (reminder) => {
      set((state) => ({ reminders: [reminder, ...state.reminders] }));
      get().persist();
    },

    toggleReminder: (id) => {
      set((state) => ({
        reminders: state.reminders.map((r) =>
          r.id === id ? { ...r, enabled: !r.enabled } : r
        ),
      }));
      get().persist();
    },

    markMedication: (reminderId, date, timeIndex, status, info) => {
      set((state) => {
        const reminder = state.reminders.find((r) => r.id === reminderId);
        const existing = state.medicationLogs.find(
          (l) =>
            l.reminderId === reminderId &&
            l.date === date &&
            l.timeIndex === timeIndex
        );
        const now = new Date().toISOString();
        if (existing) {
          return {
            medicationLogs: state.medicationLogs.map((l) =>
              l.id === existing.id ? { ...l, status, updatedAt: now } : l
            ),
          };
        }
        const newLog: MedicationLog = {
          id: 'ml_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          reminderId,
          medicineId: info?.medicineId || reminder?.medicineId || '',
          medicineName: info?.medicineName || reminder?.medicineName || '',
          memberId: info?.memberId || reminder?.memberId || '',
          memberName: info?.memberName || reminder?.memberName || '',
          dosage: info?.dosage || reminder?.dosage || '',
          date,
          scheduledTime: info?.scheduledTime || '',
          timeIndex,
          status,
          updatedAt: now,
        };
        return { medicationLogs: [newLog, ...state.medicationLogs] };
      });
      get().persist();
    },

    addFamilyMember: (member) => {
      set((state) => ({ familyMembers: [...state.familyMembers, member] }));
      get().persist();
    },

    getBarcodeQueryInfo: (barcode) => {
      const records = get().queryRecords.filter((r) => r.barcode === barcode);
      const count = records.length;
      const lastTime = count > 1 ? records[1].queryTime : null;
      return { count, lastTime };
    },
  };
});

export const mockMedicines: Medicine[] = [
  {
    id: 'med1',
    name: '布洛芬缓释胶囊',
    genericName: 'Ibuprofen Sustained Release Capsules',
    image: 'https://picsum.photos/id/1/300/300',
    approvalNumber: '国药准字H10900089',
    batchNumber: '20240501A',
    manufacturer: '中美天津史克制药有限公司',
    manufacturerAddress: '天津市东丽区程林庄道澄州路9号',
    productionDate: '2024-05-01',
    expiryDate: '2026-04-30',
    specification: '0.3g*20粒/盒',
    dosage: '口服，一次1粒，一日2次',
    usage: '早晚各一次，饭后服用',
    indication: '用于缓解轻至中度疼痛如头痛、关节痛、偏头痛、牙痛、肌肉痛、神经痛、痛经。也用于普通感冒或流行性感冒引起的发热。',
    barcode: '8123456789012',
    authenticity: 'authentic',
    queryCount: 156,
    lastQueryTime: '2026-06-08 14:30',
    category: '解热镇痛',
  },
  {
    id: 'med2',
    name: '阿莫西林胶囊',
    genericName: 'Amoxicillin Capsules',
    image: 'https://picsum.photos/id/2/300/300',
    approvalNumber: '国药准字H44021518',
    batchNumber: '20240315B',
    manufacturer: '珠海联邦制药股份有限公司',
    manufacturerAddress: '广东省珠海市金湾区三灶镇安基路2428号',
    productionDate: '2024-03-15',
    expiryDate: '2026-03-14',
    specification: '0.25g*24粒/盒',
    dosage: '口服，一次0.5g，一日3次',
    usage: '饭后温水送服',
    indication: '适用于敏感菌所致的呼吸道感染、泌尿生殖道感染、皮肤软组织感染等。',
    barcode: '8123456789023',
    authenticity: 'authentic',
    queryCount: 89,
    lastQueryTime: '2026-06-07 09:15',
    category: '抗生素',
  },
  {
    id: 'med3',
    name: '感冒灵颗粒',
    genericName: 'Ganmaoling Granules',
    image: 'https://picsum.photos/id/3/300/300',
    approvalNumber: '国药准字Z44021940',
    batchNumber: '20240210C',
    manufacturer: '华润三九医药股份有限公司',
    manufacturerAddress: '广东省深圳市龙华区观湖街道观澜高新园区',
    productionDate: '2024-02-10',
    expiryDate: '2026-02-09',
    specification: '10g*9袋/盒',
    dosage: '开水冲服，一次1袋，一日3次',
    usage: '温水冲服，饭后服用',
    indication: '解热镇痛。用于感冒引起的头痛、发热、鼻塞、流涕、咽痛。',
    barcode: '8123456789034',
    authenticity: 'suspected',
    queryCount: 312,
    category: '感冒用药',
    recallNotice: {
      id: 'rc1',
      level: 'medium',
      title: '关于部分批次感冒灵颗粒召回通知',
      content: '因发现本批次药品外包装印刷存在瑕疵，公司决定对批次20240210C产品实施召回，请相关零售企业和消费者配合。',
      publishDate: '2026-05-15',
      scope: '全国范围',
    },
  },
  {
    id: 'med4',
    name: '硝苯地平缓释片',
    genericName: 'Nifedipine Sustained Release Tablets',
    image: 'https://picsum.photos/id/6/300/300',
    approvalNumber: '国药准字H10930145',
    batchNumber: '20240420D',
    manufacturer: '拜耳医药保健有限公司',
    manufacturerAddress: '北京市经济技术开发区荣京东街7号',
    productionDate: '2024-04-20',
    expiryDate: '2026-04-19',
    specification: '20mg*30片/盒',
    dosage: '口服，一次1片，一日2次',
    usage: '整片吞服，勿嚼碎',
    indication: '高血压、心绞痛。',
    barcode: '8123456789045',
    authenticity: 'authentic',
    queryCount: 201,
    category: '心血管',
  },
  {
    id: 'med5',
    name: '维生素C片',
    genericName: 'Vitamin C Tablets',
    image: 'https://picsum.photos/id/8/300/300',
    approvalNumber: '国药准字H11021503',
    batchNumber: '20240601E',
    manufacturer: '东北制药集团股份有限公司',
    manufacturerAddress: '辽宁省沈阳市铁西区重工北街37号',
    productionDate: '2024-06-01',
    expiryDate: '2026-05-31',
    specification: '100mg*100片/瓶',
    dosage: '口服，一次1-2片，一日3次',
    usage: '饭后服用',
    indication: '用于预防坏血病，也可用于各种急慢性传染疾病及紫癜等的辅助治疗。',
    barcode: '8123456789056',
    authenticity: 'authentic',
    queryCount: 78,
    category: '维生素',
  },
  {
    id: 'med6',
    name: '奥美拉唑肠溶胶囊',
    genericName: 'Omeprazole Enteric Capsules',
    image: 'https://picsum.photos/id/9/300/300',
    approvalNumber: '国药准字H20033424',
    batchNumber: '20240110F',
    manufacturer: '山东鲁抗医药股份有限公司',
    manufacturerAddress: '山东省济宁市太白楼西路173号',
    productionDate: '2024-01-10',
    expiryDate: '2025-12-31',
    specification: '20mg*14粒/盒',
    dosage: '口服，一次1粒，一日1次',
    usage: '晨起空腹服用',
    indication: '适用于胃溃疡、十二指肠溃疡、应激性溃疡、反流性食管炎。',
    barcode: '8123456789067',
    authenticity: 'authentic',
    queryCount: 134,
    category: '消化系统',
  },
];

export const mockCirculation: Record<string, CirculationNode[]> = {
  med1: [
    {
      id: 'n1',
      type: 'manufacturer',
      name: '中美天津史克制药有限公司',
      address: '天津市东丽区程林庄道澄州路9号',
      licenseNumber: '津20160001',
      operation: '生产入库',
      operator: '生产线A-张工',
      time: '2024-05-01 10:30:00',
      batchNumber: '20240501A',
      quantity: 50000,
    },
    {
      id: 'n2',
      type: 'wholesaler',
      name: '国药集团北京医药有限公司',
      address: '北京市大兴区中关村科技园区大兴生物医药产业基地',
      licenseNumber: '京AA20180001',
      operation: '批发入库',
      operator: '质检部-李经理',
      time: '2024-05-05 14:20:00',
      quantity: 10000,
    },
    {
      id: 'n3',
      type: 'wholesaler',
      name: '北京医药商业有限公司',
      address: '北京市丰台区南四环西路186号',
      licenseNumber: '京AA20190025',
      operation: '区域配送',
      operator: '物流部-王主管',
      time: '2024-05-10 09:15:00',
      quantity: 2000,
    },
    {
      id: 'n4',
      type: 'retailer',
      name: '老百姓大药房(朝阳店)',
      address: '北京市朝阳区建国路88号',
      licenseNumber: '京DA20200001',
      operation: '药店收货验收',
      operator: '执业药师-刘药师',
      time: '2024-05-12 16:45:00',
      quantity: 200,
    },
    {
      id: 'n5',
      type: 'consumer',
      name: '张先生(消费者)',
      address: '北京市朝阳区',
      licenseNumber: '-',
      operation: '购买取药',
      operator: '收银员-陈小姐',
      time: '2026-06-08 14:25:00',
      quantity: 2,
    },
  ],
  med2: [
    {
      id: 'n1',
      type: 'manufacturer',
      name: '珠海联邦制药股份有限公司',
      address: '广东省珠海市金湾区三灶镇安基路2428号',
      licenseNumber: '粤20150088',
      operation: '生产入库',
      operator: '生产线B-赵工',
      time: '2024-03-15 08:00:00',
      batchNumber: '20240315B',
      quantity: 80000,
    },
    {
      id: 'n2',
      type: 'wholesaler',
      name: '广东省医药集团有限公司',
      address: '广州市荔湾区大同路103号',
      licenseNumber: '粤AA20170003',
      operation: '批发入库',
      operator: '质检部-周经理',
      time: '2024-03-20 11:30:00',
      quantity: 20000,
    },
    {
      id: 'n3',
      type: 'retailer',
      name: '大参林药房(天河店)',
      address: '广州市天河区天河路228号',
      licenseNumber: '粤DA20210088',
      operation: '药店收货验收',
      operator: '执业药师-黄药师',
      time: '2024-03-25 15:10:00',
      quantity: 500,
    },
  ],
};

export const mockNearbyStores: NearbyStore[] = [
  {
    id: 'st1',
    name: '老百姓大药房(朝阳店)',
    address: '北京市朝阳区建国路88号SOHO现代城底商',
    phone: '010-12345678',
    distance: 0.3,
    licenseNumber: '京DA20200001',
    rating: 4.8,
    businessHours: '08:00-22:00',
    type: 'chain',
  },
  {
    id: 'st2',
    name: '益丰大药房(国贸店)',
    address: '北京市朝阳区建国门外大街甲6号',
    phone: '010-23456789',
    distance: 0.6,
    licenseNumber: '京DA20200015',
    rating: 4.6,
    businessHours: '07:30-22:30',
    type: 'chain',
  },
  {
    id: 'st3',
    name: '北京协和医院药房',
    address: '北京市东城区帅府园1号',
    phone: '010-69156114',
    distance: 1.2,
    licenseNumber: '京YY20180001',
    rating: 4.9,
    businessHours: '08:00-17:30',
    type: 'hospital',
  },
  {
    id: 'st4',
    name: '康源堂大药房',
    address: '北京市朝阳区光华路9号',
    phone: '010-34567890',
    distance: 0.8,
    licenseNumber: '京DA20210056',
    rating: 4.5,
    businessHours: '24小时营业',
    type: 'independent',
  },
  {
    id: 'st5',
    name: '海王星辰健康药房(CBD店)',
    address: '北京市朝阳区光华路甲8号和乔大厦1层',
    phone: '010-45678901',
    distance: 1.0,
    licenseNumber: '京DA20200033',
    rating: 4.7,
    businessHours: '08:00-22:00',
    type: 'chain',
  },
];
