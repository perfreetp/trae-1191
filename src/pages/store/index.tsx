import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  Input,
  Switch,
  Image,
  Picker,
} from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import {
  useAppStore,
  mockNearbyStores,
  mockMedicines,
} from '@/store/useAppStore';
import EmptyState from '@/components/EmptyState';
import { getStoreTypeLabel, generateId, formatDate } from '@/utils';
import type { NearbyStore, Medicine, StoreRecord } from '@/types';
import styles from './index.module.scss';

type TabType = 'nearby' | 'records';
type AddStep = 0 | 1 | 2 | 3 | 4;
type SourceType = 'scan' | 'favorite' | 'recent' | 'manual' | 'split';

interface StoreDraft {
  mode: 'normal' | 'split';
  medicineId: string;
  medicineName: string;
  barcode: string;
  batchNumber: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeLicense: string;
  storePhone: string;
  quantity: number;
  unitPrice: string;
  totalPrice: number;
  isSplitSale: boolean;
  splitQuantity: string;
  receiptImages: string[];
  notes: string;
  purchaseDate: string;
}

const todayISO = () => new Date().toISOString().split('T')[0];

const StorePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('nearby');

  const storeRecords = useAppStore((s) => s.storeRecords);
  const addStoreRecord = useAppStore((s) => s.addStoreRecord);
  const currentMemberId = useAppStore((s) => s.currentMemberId);
  const familyMembers = useAppStore((s) => s.familyMembers);
  const favorites = useAppStore((s) => s.favorites);
  const queryRecords = useAppStore((s) => s.queryRecords);
  const currentMember = familyMembers.find((m) => m.id === currentMemberId);

  const sortedStores = useMemo(
    () => [...mockNearbyStores].sort((a, b) => a.distance - b.distance),
    []
  );

  const favoriteMedicines = useMemo(
    () => mockMedicines.filter((m) => favorites.includes(m.id)),
    [favorites]
  );

  const recentMedicines = useMemo(() => {
    const map = new Map<string, Medicine>();
    queryRecords.forEach((r) => {
      const m = mockMedicines.find((mm) => mm.id === r.medicineId);
      if (m && !map.has(m.id)) map.set(m.id, m);
    });
    return Array.from(map.values());
  }, [queryRecords]);

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<AddStep>(0);
  const [draft, setDraft] = useState<StoreDraft>({
    mode: 'normal',
    medicineId: '',
    medicineName: '',
    barcode: '',
    batchNumber: '',
    storeId: sortedStores[0]?.id || '',
    storeName: sortedStores[0]?.name || '',
    storeAddress: sortedStores[0]?.address || '',
    storeLicense: sortedStores[0]?.licenseNumber || '',
    storePhone: sortedStores[0]?.phone || '',
    quantity: 1,
    unitPrice: '',
    totalPrice: 0,
    isSplitSale: false,
    splitQuantity: '',
    receiptImages: [],
    notes: '',
    purchaseDate: todayISO(),
  });

  const resetDraft = (mode: 'normal' | 'split' = 'normal') => {
    const def = sortedStores[0];
    setDraft({
      mode,
      medicineId: '',
      medicineName: '',
      barcode: '',
      batchNumber: '',
      storeId: def?.id || '',
      storeName: def?.name || '',
      storeAddress: def?.address || '',
      storeLicense: def?.licenseNumber || '',
      storePhone: def?.phone || '',
      quantity: 1,
      unitPrice: '',
      totalPrice: 0,
      isSplitSale: mode === 'split',
      splitQuantity: '',
      receiptImages: [],
      notes: '',
      purchaseDate: todayISO(),
    });
    setStep(0);
  };

  const openAdd = (mode: 'normal' | 'split') => {
    resetDraft(mode);
    setShowModal(true);
  };

  const closeAdd = () => {
    setShowModal(false);
    setTimeout(() => resetDraft('normal'), 200);
  };

  const recalcTotal = (d: StoreDraft): StoreDraft => {
    const qty = d.isSplitSale
      ? parseFloat(d.splitQuantity || '0') || 0
      : d.quantity;
    const price = parseFloat(d.unitPrice || '0') || 0;
    return { ...d, totalPrice: Math.round(qty * price * 100) / 100 };
  };

  const setUnitPrice = (val: string) =>
    setDraft((d) => recalcTotal({ ...d, unitPrice: val }));

  const setQuantity = (val: number) =>
    setDraft((d) => recalcTotal({ ...d, quantity: val }));

  const setSplitQty = (val: string) =>
    setDraft((d) => recalcTotal({ ...d, splitQuantity: val }));

  const setSplitFlag = (v: boolean) =>
    setDraft((d) => recalcTotal({ ...d, isSplitSale: v }));

  const selectStore = (store: NearbyStore) => {
    setDraft((d) => ({
      ...d,
      storeId: store.id,
      storeName: store.name,
      storeAddress: store.address,
      storeLicense: store.licenseNumber,
      storePhone: store.phone,
    }));
    setStep(2);
  };

  const selectMedicine = (m: Medicine) => {
    setDraft((d) => ({
      ...d,
      medicineId: m.id,
      medicineName: m.name,
      barcode: m.barcode,
      batchNumber: m.batchNumber,
    }));
    setStep(1);
  };

  const submitManual = () => {
    if (!draft.medicineName.trim()) {
      Taro.showToast({ title: '请输入药品名称', icon: 'none' });
      return;
    }
    setStep(1);
  };

  const handleScan = async () => {
    try {
      const res = await Taro.scanCode({});
      const med = mockMedicines.find((m) => m.barcode === res.result);
      if (med) {
        selectMedicine(med);
      } else {
        Taro.showToast({ title: '未识别药品，请手动输入', icon: 'none' });
      }
    } catch (e) {
      console.warn('[Store] scan failed', e);
    }
  };

  const uploadReceipt = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 3 - draft.receiptImages.length,
        sizeType: ['compressed'],
      });
      setDraft((d) => ({
        ...d,
        receiptImages: [...d.receiptImages, ...res.tempFilePaths].slice(0, 3),
      }));
      Taro.showToast({ title: '已添加票据', icon: 'success' });
    } catch (e) {
      console.warn('[Store] upload failed', e);
    }
  };

  const removeReceipt = (idx: number) => {
    setDraft((d) => ({
      ...d,
      receiptImages: d.receiptImages.filter((_, i) => i !== idx),
    }));
  };

  const saveRecord = () => {
    if (!draft.medicineName) {
      Taro.showToast({ title: '请选择或输入药品', icon: 'none' });
      return;
    }
    if (!draft.storeName) {
      Taro.showToast({ title: '请选择购买门店', icon: 'none' });
      return;
    }
    if (!draft.unitPrice) {
      Taro.showToast({ title: '请填写单价', icon: 'none' });
      return;
    }
    if (draft.isSplitSale && !draft.splitQuantity) {
      Taro.showToast({ title: '请填写拆零数量', icon: 'none' });
      return;
    }

    const record: StoreRecord = {
      id: generateId(),
      storeName: draft.storeName,
      storeAddress: draft.storeAddress,
      storeLicense: draft.storeLicense,
      storePhone: draft.storePhone,
      purchaseDate: draft.purchaseDate,
      medicineId: draft.medicineId || 'custom_' + Date.now(),
      medicineName: draft.medicineName,
      batchNumber: draft.batchNumber,
      quantity: draft.isSplitSale
        ? parseFloat(draft.splitQuantity || '0') || 0
        : draft.quantity,
      unitPrice: parseFloat(draft.unitPrice) || 0,
      totalPrice: draft.totalPrice,
      isSplitSale: draft.isSplitSale,
      splitQuantity: draft.isSplitSale
        ? parseFloat(draft.splitQuantity || '0') || 0
        : undefined,
      receiptImages: draft.receiptImages.length ? draft.receiptImages : undefined,
      notes: draft.notes || undefined,
    };
    addStoreRecord(record);
    Taro.showToast({ title: '登记成功', icon: 'success' });
    setActiveTab('records');
    closeAdd();
  };

  const handleActionClick = (idx: number) => {
    if (idx === 0) openAdd('normal');
    else if (idx === 1) openAdd('split');
    else if (idx === 2) uploadReceiptStandalone();
    else handleLocate();
  };

  const uploadReceiptStandalone = () => {
    if (storeRecords.length === 0) {
      Taro.showToast({ title: '请先登记购买记录', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList: storeRecords
        .slice(0, 6)
        .map((r) => `${r.purchaseDate} · ${r.medicineName} ×${r.quantity}`),
      success: async (res) => {
        const rec = storeRecords[res.tapIndex];
        if (!rec) return;
        try {
          const imgs = await Taro.chooseImage({ count: 3 });
          const updated: StoreRecord = {
            ...rec,
            receiptImages: [...(rec.receiptImages || []), ...imgs.tempFilePaths].slice(0, 3),
          };
          useAppStore.setState((s) => ({
            storeRecords: s.storeRecords.map((r) =>
              r.id === rec.id ? updated : r
            ),
          }));
          useAppStore.getState().persist();
          Taro.showToast({ title: '票据已关联', icon: 'success' });
        } catch (e) {
          console.warn(e);
        }
      },
    });
  };

  const handleLocate = () => {
    Taro.showToast({ title: '已定位到当前位置', icon: 'none' });
  };

  const handleNavigate = (store: NearbyStore) => {
    Taro.openLocation({
      latitude: 39.9 + store.distance * 0.01,
      longitude: 116.4,
      name: store.name,
      address: store.address,
      scale: 16,
    });
  };

  const handleCall = (phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone });
  };

  useEffect(() => {
    if (showModal && step === 0 && draft.mode === 'split') {
      setStep(0.5 as any);
    }
  }, [showModal, step, draft.mode]);

  /* ---------- 渲染：多步 modal ---------- */
  const renderStep0 = () => {
    const sources: Array<{
      key: SourceType;
      icon: string;
      name: string;
      desc: string;
      disabled?: boolean;
      onClick: () => void;
    }> = [
      {
        key: 'scan',
        icon: '📷',
        name: '扫码登记',
        desc: '扫描药品包装码自动录入',
        onClick: handleScan,
      },
      {
        key: 'favorite',
        icon: '❤️',
        name: '从常用药',
        desc: `${favoriteMedicines.length}种收藏`,
        disabled: favoriteMedicines.length === 0,
        onClick: () => setStep(0.5 as any),
      },
      {
        key: 'recent',
        icon: '📋',
        name: '最近核验',
        desc: `${recentMedicines.length}种近期记录`,
        disabled: recentMedicines.length === 0,
        onClick: () => {
          (draft as any)._src = 'recent';
          setStep(0.5 as any);
        },
      },
      {
        key: 'manual',
        icon: '⌨️',
        name: '手动输入',
        desc: '手动填写药品信息',
        onClick: () => {
          (draft as any)._src = 'manual';
          setStep(0.5 as any);
        },
      },
    ];
    return (
      <View className={styles.stepBody}>
        <Text className={styles.stepTitle}>
          {draft.mode === 'split' ? '登记拆零销售：选药品' : '登记购买记录'}
        </Text>
        {draft.mode === 'split' && (
          <Text className={styles.stepTip}>
            请先选择拆零的药品，下一步填写拆零数量
          </Text>
        )}
        <View className={styles.sourceGrid}>
          {sources.map((s) => (
            <View
              key={s.key}
              className={classnames(
                styles.sourceCardMini,
                s.disabled && styles.disabled
              )}
              onClick={() => !s.disabled && s.onClick()}
            >
              <Text className={styles.sourceIcon}>{s.icon}</Text>
              <Text className={styles.sourceName}>{s.name}</Text>
              <Text className={styles.sourceDesc}>{s.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStepHalf = () => {
    const src = (draft as any)._src;
    if (src === 'manual') {
      return (
        <View className={styles.stepBody}>
          <Text className={styles.stepTitle}>输入药品信息</Text>
          <View className={styles.field}>
            <Text className={styles.fieldLabel}>药品名称 *</Text>
            <Input
              className={styles.fieldInput}
              value={draft.medicineName}
              onInput={(e) =>
                setDraft((d) => ({ ...d, medicineName: e.detail.value }))
              }
              placeholder="例：头孢克肟胶囊"
            />
          </View>
          <View className={styles.field}>
            <Text className={styles.fieldLabel}>产品批号（可选）</Text>
            <Input
              className={styles.fieldInput}
              value={draft.batchNumber}
              onInput={(e) =>
                setDraft((d) => ({ ...d, batchNumber: e.detail.value }))
              }
              placeholder="例：20240101"
            />
          </View>
          <Button className={styles.primaryBtn} onClick={submitManual}>
            下一步 →
          </Button>
        </View>
      );
    }
    const list = src === 'recent' ? recentMedicines : favoriteMedicines;
    return (
      <View className={styles.stepBody}>
        <Text className={styles.stepTitle}>
          {src === 'recent' ? '从最近核验选择' : '从常用药选择'}
        </Text>
        <View className={styles.medPickerList}>
          {list.map((m) => (
            <View
              key={m.id}
              className={classnames(
                styles.medPickerItem,
                draft.medicineId === m.id && styles.medPickerActive
              )}
              onClick={() => selectMedicine(m)}
            >
              <Image
                className={styles.medPickerImg}
                src={m.image}
                mode="aspectFill"
              />
              <View className={styles.medPickerInfo}>
                <Text className={styles.medPickerName}>{m.name}</Text>
                <Text className={styles.medPickerSpec}>{m.specification}</Text>
                <Text className={styles.medPickerDosage}>
                  批号: {m.batchNumber}
                </Text>
              </View>
              <View className={styles.medPickerRadio}>
                {draft.medicineId === m.id ? '✓' : ''}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStep1 = () => (
    <View className={styles.stepBody}>
      <Text className={styles.stepTitle}>选择购买门店</Text>
      <Text className={styles.stepTip}>
        药品：{draft.medicineName}
        {draft.isSplitSale && '（拆零销售）'}
      </Text>
      <View className={styles.storePickerList}>
        {sortedStores.map((s) => (
          <View
            key={s.id}
            className={classnames(
              styles.storePickerItem,
              draft.storeId === s.id && styles.medPickerActive
            )}
            onClick={() => selectStore(s)}
          >
            <View className={styles.storeIconSmall}>
              {s.type === 'hospital'
                ? '🏥'
                : s.type === 'chain'
                  ? '🏪'
                  : '💊'}
            </View>
            <View className={styles.medPickerInfo}>
              <Text className={styles.medPickerName}>{s.name}</Text>
              <Text className={styles.medPickerSpec}>{s.address}</Text>
              <Text className={styles.medPickerDosage}>
                {getStoreTypeLabel(s.type)} · {s.distance}km · {s.businessHours}
              </Text>
            </View>
            <View className={styles.medPickerRadio}>
              {draft.storeId === s.id ? '✓' : ''}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className={styles.stepBody}>
      <Text className={styles.stepTitle}>填写购买信息</Text>
      <Text className={styles.stepTip}>
        {draft.storeName} · {draft.medicineName}
      </Text>

      <View className={styles.field}>
        <View className={styles.fieldRow}>
          <Text className={styles.fieldLabel}>拆零销售</Text>
          <Switch
            checked={draft.isSplitSale}
            onChange={(e) => setSplitFlag(e.detail.value)}
            color="#0EA5E9"
          />
        </View>
      </View>

      <View className={styles.field}>
        <Text className={styles.fieldLabel}>
          {draft.isSplitSale ? '拆零数量（粒/片/袋/毫升） *' : '购买数量（盒/瓶）'}
        </Text>
        {draft.isSplitSale ? (
          <Input
            type="digit"
            className={styles.fieldInput}
            value={draft.splitQuantity}
            onInput={(e) => setSplitQty(e.detail.value)}
            placeholder="例：5 或 10"
          />
        ) : (
          <View className={styles.qtyRow}>
            <View
              className={styles.qtyBtn}
              onClick={() => setQuantity(Math.max(1, draft.quantity - 1))}
            >
              －
            </View>
            <Text className={styles.qtyNum}>{draft.quantity}</Text>
            <View
              className={styles.qtyBtn}
              onClick={() => setQuantity(draft.quantity + 1)}
            >
              ＋
            </View>
            <Text className={styles.qtyUnit}>盒</Text>
          </View>
        )}
      </View>

      <View className={styles.field}>
        <Text className={styles.fieldLabel}>单价（元） *</Text>
        <Input
          type="digit"
          className={styles.fieldInput}
          value={draft.unitPrice}
          onInput={(e) => setUnitPrice(e.detail.value)}
          placeholder="例：28.50"
        />
      </View>

      <View className={styles.field}>
        <View className={styles.fieldRow}>
          <Text className={styles.fieldLabel}>合计金额</Text>
          <Text className={styles.totalNum}>¥{draft.totalPrice.toFixed(2)}</Text>
        </View>
      </View>

      <View className={styles.field}>
        <Text className={styles.fieldLabel}>购买日期</Text>
        <Picker
          mode="date"
          value={draft.purchaseDate}
          end={todayISO()}
          onChange={(e) =>
            setDraft((d) => ({ ...d, purchaseDate: e.detail.value }))
          }
        >
          <View className={styles.fieldInputRow}>
            {formatDate(draft.purchaseDate)}
          </View>
        </Picker>
      </View>

      <View className={styles.field}>
        <Text className={styles.fieldLabel}>
          票据照片（最多3张，可选）
        </Text>
        <View className={styles.imgGrid}>
          {draft.receiptImages.map((img, i) => (
            <View key={i} className={styles.imgBox}>
              <Image
                src={img}
                className={styles.img}
                mode="aspectFill"
                onClick={() => {
                  Taro.previewImage({
                    urls: draft.receiptImages,
                    current: img,
                  });
                }}
              />
              <View
                className={styles.imgDel}
                onClick={() => removeReceipt(i)}
              >
                ✕
              </View>
            </View>
          ))}
          {draft.receiptImages.length < 3 && (
            <View className={styles.imgAdd} onClick={uploadReceipt}>
              <Text className={styles.imgAddIcon}>＋</Text>
              <Text className={styles.imgAddText}>添加票据</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.field}>
        <Text className={styles.fieldLabel}>备注（可选）</Text>
        <Input
          className={styles.fieldInput}
          value={draft.notes}
          onInput={(e) => setDraft((d) => ({ ...d, notes: e.detail.value }))}
          placeholder="例：执业药师指导下购买 / 凭处方购买"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className={styles.stepBody}>
      <Text className={styles.stepTitle}>确认登记信息</Text>
      <View className={styles.summaryCard}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>💊 药品</Text>
          <Text className={styles.summaryValue}>
            {draft.medicineName}
            {draft.batchNumber ? `（${draft.batchNumber}）` : ''}
          </Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>🏪 门店</Text>
          <Text className={styles.summaryValue}>{draft.storeName}</Text>
        </View>
        {draft.isSplitSale && (
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>✂️ 拆零</Text>
            <Text className={classnames(styles.summaryValue, styles.danger)}>
              是，拆零数量：{draft.splitQuantity}
            </Text>
          </View>
        )}
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>🔢 数量</Text>
          <Text className={styles.summaryValue}>
            {draft.isSplitSale
              ? `拆零 ${draft.splitQuantity} 份`
              : `${draft.quantity} 盒/瓶`}
          </Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>💰 金额</Text>
          <Text className={classnames(styles.summaryValue, styles.primary)}>
            ¥{draft.unitPrice} ×{' '}
            {draft.isSplitSale ? draft.splitQuantity : draft.quantity} = ¥
            {draft.totalPrice.toFixed(2)}
          </Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>📅 日期</Text>
          <Text className={styles.summaryValue}>
            {formatDate(draft.purchaseDate)}
          </Text>
        </View>
        {draft.receiptImages.length > 0 && (
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>🧾 票据</Text>
            <View className={styles.receiptMiniList}>
              {draft.receiptImages.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  mode="aspectFill"
                  className={styles.receiptMini}
                />
              ))}
              <Text style={{ marginLeft: 8, fontSize: 24, color: '#94A3B8' }}>
                {draft.receiptImages.length}张
              </Text>
            </View>
          </View>
        )}
      </View>
      <Button className={styles.primaryBtn} onClick={saveRecord}>
        ✅ 确认登记
      </Button>
    </View>
  );

  const renderBody = () => {
    if (step === (0.5 as any)) return renderStepHalf();
    switch (step) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.actionGrid}>
        {[
          { icon: '📝', title: '登记购买', desc: '扫码或手动登记购药记录', cls: 'blue' },
          { icon: '✂️', title: '拆零销售', desc: '登记药品拆零销售记录', cls: 'green' },
          { icon: '🧾', title: '上传票据', desc: '拍照上传购药小票凭证', cls: 'orange' },
          { icon: '📍', title: '附近门店', desc: '查看周边正规药店信息', cls: 'purple' },
        ].map((a, i) => (
          <View
            key={i}
            className={styles.actionCard}
            onClick={() => handleActionClick(i)}
          >
            <View className={`${styles.actionIcon} ${styles[a.cls]}`}>{a.icon}</View>
            <Text className={styles.actionTitle}>{a.title}</Text>
            <Text className={styles.actionDesc}>{a.desc}</Text>
          </View>
        ))}
      </View>

      <View className={styles.content}>
        <View
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Button
            onClick={() => setActiveTab('nearby')}
            style={{
              flex: 1,
              height: 64,
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'nearby' ? '#0EA5E9' : '#fff',
              color: activeTab === 'nearby' ? '#fff' : '#475569',
              fontSize: 28,
              fontWeight: 500,
            }}
          >
            附近门店 ({sortedStores.length})
          </Button>
          <Button
            onClick={() => setActiveTab('records')}
            style={{
              flex: 1,
              height: 64,
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'records' ? '#0EA5E9' : '#fff',
              color: activeTab === 'records' ? '#fff' : '#475569',
              fontSize: 28,
              fontWeight: 500,
            }}
          >
            购买记录 ({storeRecords.length})
          </Button>
        </View>

        {activeTab === 'nearby' && (
          <>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>🏥 周边正规药店</Text>
              <Text className={styles.sectionMore}>按距离排序</Text>
            </View>
            {sortedStores.length === 0 ? (
              <EmptyState icon="🏪" title="附近暂无门店" />
            ) : (
              sortedStores.map((store) => (
                <View key={store.id} className={styles.storeCard}>
                  <View className={styles.storeHeader}>
                    <View className={styles.storeIcon}>
                      {store.type === 'hospital'
                        ? '🏥'
                        : store.type === 'chain'
                          ? '🏪'
                          : '💊'}
                    </View>
                    <View className={styles.storeInfo}>
                      <Text className={styles.storeName}>{store.name}</Text>
                      <View className={styles.storeMeta}>
                        <View className={classnames(styles.tag, styles[store.type])}>
                          {getStoreTypeLabel(store.type)}
                        </View>
                        <Text className={styles.rating}>⭐ {store.rating}</Text>
                        <Text className={styles.distance}>📍 {store.distance}km</Text>
                      </View>
                    </View>
                  </View>
                  <View className={styles.storeDetails}>
                    <View className={styles.detailRow}>
                      <Text className={styles.detailLabel}>地址</Text>
                      <Text className={styles.detailValue}>{store.address}</Text>
                    </View>
                    <View className={styles.detailRow}>
                      <Text className={styles.detailLabel}>营业时间</Text>
                      <Text className={styles.detailValue}>{store.businessHours}</Text>
                    </View>
                    <View className={styles.detailRow}>
                      <Text className={styles.detailLabel}>联系电话</Text>
                      <Text className={styles.detailValue}>{store.phone}</Text>
                    </View>
                    <View className={styles.detailRow}>
                      <Text className={styles.detailLabel}>许可证号</Text>
                      <Text className={styles.detailValue}>{store.licenseNumber}</Text>
                    </View>
                  </View>
                  <View className={styles.storeActions}>
                    <Button
                      className={classnames(styles.actionBtn, styles.secondary)}
                      onClick={() => handleCall(store.phone)}
                    >
                      📞 拨打电话
                    </Button>
                    <Button
                      className={classnames(styles.actionBtn, styles.primary)}
                      onClick={() => handleNavigate(store)}
                    >
                      🧭 导航前往
                    </Button>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'records' && (
          <>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>📋 我的购药记录</Text>
              {currentMember && (
                <Text className={styles.sectionMore}>当前: {currentMember.name}</Text>
              )}
            </View>
            {storeRecords.length === 0 ? (
              <EmptyState
                icon="🧾"
                title="暂无购药记录"
                desc="点击上方「登记购买」录入您的购药信息"
              />
            ) : (
              storeRecords.map((record) => (
                <View key={record.id} className={styles.recordCard}>
                  <View className={styles.recordHeader}>
                    <Text className={styles.recordStore}>{record.storeName}</Text>
                    <Text className={styles.recordDate}>{record.purchaseDate}</Text>
                  </View>
                  <View className={styles.recordBody}>
                    <View className={styles.medicineRow}>
                      <Text className={styles.medicineName}>💊 {record.medicineName}</Text>
                      <Text className={styles.medicineQty}>
                        {record.isSplitSale
                          ? `✂️ 拆零×${record.splitQuantity || record.quantity}`
                          : `×${record.quantity}`}
                        　· {record.batchNumber || '—'}
                      </Text>
                    </View>
                    <View className={styles.medicineRow}>
                      <Text
                        className={styles.medicineName}
                        style={{ fontSize: 24, color: '#94A3B8' }}
                      >
                        单价: ¥{record.unitPrice.toFixed(2)}
                      </Text>
                      {record.isSplitSale && (
                        <View className={styles.splitTag}>
                          ✂️ 拆零: {record.splitQuantity || record.quantity}份
                        </View>
                      )}
                    </View>
                    {record.receiptImages && record.receiptImages.length > 0 && (
                      <View className={styles.recordReceiptRow}>
                        <Text style={{ fontSize: 22, color: '#94A3B8', marginRight: 12 }}>
                          🧾 票据:
                        </Text>
                        <View className={styles.recordReceiptList}>
                          {record.receiptImages.map((img, i) => (
                            <Image
                              key={i}
                              src={img}
                              mode="aspectFill"
                              className={styles.recordReceiptImg}
                              onClick={() =>
                                Taro.previewImage({
                                  urls: record.receiptImages!,
                                  current: img,
                                })
                              }
                            />
                          ))}
                        </View>
                      </View>
                    )}
                    {record.notes && (
                      <View className={styles.recordBody}>
                        <Text style={{ fontSize: 22, color: '#94A3B8' }}>
                          📝 {record.notes}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className={styles.recordFooter}>
                    <View style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {!record.isSplitSale ? (
                        <View />
                      ) : (
                        <View className={styles.splitTag}>✂️ 拆零销售</View>
                      )}
                    </View>
                    <Text className={styles.totalPrice}>
                      ¥{record.totalPrice.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </View>

      {showModal && (
        <View className={styles.modalMask} onClick={closeAdd}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalClose} onClick={closeAdd}>
                ✕
              </Text>
              <Text className={styles.modalTitle}>
                {step === 0 && (draft.mode === 'split' ? '拆零销售登记' : '登记购买记录')}
                {step === (0.5 as any) && '1/4 · 选择药品'}
                {step === 1 && '2/4 · 选择门店'}
                {step === 2 && '3/4 · 填写信息'}
                {step === 3 && '4/4 · 确认登记'}
              </Text>
              {(step > 0 || step === (0.5 as any)) && step !== 3 && (
                <Text
                  className={styles.modalBack}
                  onClick={() => {
                    if (step === 1 || step === (0.5 as any)) setStep(0);
                    else if (step === 2) setStep(1);
                    else if (step === 3) setStep(2);
                  }}
                >
                  ← 返回
                </Text>
              )}
              {step === 3 && <View style={{ width: 60 }} />}
            </View>
            {renderBody()}
            {step === 2 && (
              <View className={styles.modalFooter}>
                <Button className={styles.primaryBtn} onClick={() => setStep(3)}>
                  下一步 →
                </Button>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default StorePage;
