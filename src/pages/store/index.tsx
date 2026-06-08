import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore, mockNearbyStores, mockMedicines } from '@/store/useAppStore';
import EmptyState from '@/components/EmptyState';
import { getStoreTypeLabel } from '@/utils';
import type { NearbyStore } from '@/types';
import styles from './index.module.scss';

type TabType = 'nearby' | 'records';

const StorePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('nearby');

  const storeRecords = useAppStore((s) => s.storeRecords);
  const addStoreRecord = useAppStore((s) => s.addStoreRecord);
  const currentMemberId = useAppStore((s) => s.currentMemberId);
  const familyMembers = useAppStore((s) => s.familyMembers);
  const currentMember = familyMembers.find((m) => m.id === currentMemberId);

  const sortedStores = useMemo(
    () => [...mockNearbyStores].sort((a, b) => a.distance - b.distance),
    []
  );

  const handleAddStoreRecord = () => {
    Taro.showActionSheet({
      itemList: ['扫码登记购买', '选择药品登记', '登记拆零销售'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          try {
            const scanRes = await Taro.scanCode({});
            const med = mockMedicines.find((m) => m.barcode === scanRes.result);
            if (med) {
              mockSubmitRecord(med);
            } else {
              Taro.showToast({ title: '未找到药品信息', icon: 'none' });
            }
          } catch (e) {
            console.error('[Store] scan failed', e);
          }
        } else {
          Taro.showToast({ title: '功能开发中', icon: 'none' });
        }
      },
    });
  };

  const mockSubmitRecord = (med) => {
    addStoreRecord({
      id: `${Date.now()}`,
      storeName: '老百姓大药房(朝阳店)',
      storeAddress: '北京市朝阳区建国路88号',
      storeLicense: '京DA20200001',
      storePhone: '010-12345678',
      purchaseDate: new Date().toISOString().split('T')[0],
      medicineId: med.id,
      medicineName: med.name,
      batchNumber: med.batchNumber,
      quantity: 1,
      unitPrice: Math.round(med.queryCount / 5),
      totalPrice: Math.round(med.queryCount / 5),
      isSplitSale: false,
    });
    Taro.showToast({ title: '登记成功', icon: 'success' });
  };

  const handleUploadReceipt = () => {
    Taro.chooseImage({
      count: 3,
      success: (res) => {
        console.log('[Store] upload receipt:', res.tempFilePaths);
        Taro.showToast({ title: '票据上传成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('[Store] upload failed:', err);
        Taro.showToast({ title: '已取消上传', icon: 'none' });
      },
    });
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

  const handleSplitSale = () => {
    Taro.showModal({
      title: '登记拆零销售',
      content: '请确认该笔销售为拆零销售，并在药房执业药师指导下完成拆零登记。',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '拆零登记成功', icon: 'success' });
        }
      },
    });
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.actionGrid}>
        <View className={styles.actionCard} onClick={handleAddStoreRecord}>
          <View className={`${styles.actionIcon} ${styles.blue}`}>📝</View>
          <Text className={styles.actionTitle}>登记购买</Text>
          <Text className={styles.actionDesc}>扫码或手动登记购药记录</Text>
        </View>
        <View className={styles.actionCard} onClick={handleSplitSale}>
          <View className={`${styles.actionIcon} ${styles.green}`}>✂️</View>
          <Text className={styles.actionTitle}>拆零销售</Text>
          <Text className={styles.actionDesc}>登记药品拆零销售记录</Text>
        </View>
        <View className={styles.actionCard} onClick={handleUploadReceipt}>
          <View className={`${styles.actionIcon} ${styles.orange}`}>🧾</View>
          <Text className={styles.actionTitle}>上传票据</Text>
          <Text className={styles.actionDesc}>拍照上传购药小票凭证</Text>
        </View>
        <View
          className={styles.actionCard}
          onClick={() => Taro.showToast({ title: '已定位到当前位置', icon: 'none' })}
        >
          <View className={`${styles.actionIcon} ${styles.purple}`}>📍</View>
          <Text className={styles.actionTitle}>附近门店</Text>
          <Text className={styles.actionDesc}>查看周边正规药店信息</Text>
        </View>
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
            className={classnames({
              [styles.tabItem ?? '']: true,
              [styles.active ?? '']: activeTab === 'nearby',
            })}
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
                      {store.type === 'hospital' ? '🏥' : store.type === 'chain' ? '🏪' : '💊'}
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
                desc="点击上方"登记购买"录入您的购药信息"
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
                        x{record.quantity} · {record.batchNumber}
                      </Text>
                    </View>
                    <View className={styles.medicineRow}>
                      <Text className={styles.medicineName} style={{ fontSize: 24, color: '#94A3B8' }}>
                        单价: ¥{record.unitPrice.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.recordFooter}>
                    {record.isSplitSale ? (
                      <View className={styles.splitTag}>✂️ 拆零销售</View>
                    ) : (
                      <View />
                    )}
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
    </ScrollView>
  );
};

export default StorePage;
