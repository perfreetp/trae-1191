import dayjs from 'dayjs';

export const formatDate = (date: string, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

export const getDaysToExpiry = (expiryDate: string): number => {
  return dayjs(expiryDate).diff(dayjs(), 'day');
};

export const getExpiryStatus = (
  expiryDate: string
): { status: 'expired' | 'near' | 'normal'; label: string; color: string } => {
  const days = getDaysToExpiry(expiryDate);
  if (days < 0) {
    return { status: 'expired', label: `已过期${Math.abs(days)}天`, color: 'expired' };
  }
  if (days <= 90) {
    return { status: 'near', label: `距效期${days}天`, color: 'near' };
  }
  return { status: 'normal', label: `有效期至${formatDate(expiryDate)}`, color: 'normal' };
};

export const getAuthenticityLabel = (
  authenticity: 'authentic' | 'suspected' | 'unknown'
): { label: string; color: string } => {
  switch (authenticity) {
    case 'authentic':
      return { label: '正品溯源', color: 'success' };
    case 'suspected':
      return { label: '疑似异常', color: 'warning' };
    default:
      return { label: '数据缺失', color: 'info' };
  }
};

export const getReportTypeLabel = (
  type: 'damage' | 'counterfeit' | 'expired' | 'other'
): string => {
  switch (type) {
    case 'damage':
      return '包装破损';
    case 'counterfeit':
      return '疑似假药';
    case 'expired':
      return '过期药品';
    default:
      return '其他问题';
  }
};

export const getReportStatusLabel = (
  status: 'pending' | 'processing' | 'resolved' | 'rejected'
): { label: string; color: string } => {
  switch (status) {
    case 'pending':
      return { label: '待处理', color: 'warning' };
    case 'processing':
      return { label: '处理中', color: 'info' };
    case 'resolved':
      return { label: '已处理', color: 'success' };
    default:
      return { label: '已驳回', color: 'error' };
  }
};

export const getCirculationTypeLabel = (
  type: 'manufacturer' | 'wholesaler' | 'retailer' | 'consumer'
): string => {
  switch (type) {
    case 'manufacturer':
      return '生产企业';
    case 'wholesaler':
      return '批发企业';
    case 'retailer':
      return '零售药店';
    default:
      return '消费者';
  }
};

export const getStoreTypeLabel = (type: 'chain' | 'independent' | 'hospital'): string => {
  switch (type) {
    case 'chain':
      return '连锁药房';
    case 'independent':
      return '独立药房';
    default:
      return '医院药房';
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const validateBarcode = (barcode: string): boolean => {
  return /^\d{13}$/.test(barcode);
};
