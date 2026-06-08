import React, { useState } from 'react';
import { View, Text, Button, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore, mockMedicines } from '@/store/useAppStore';
import { generateId, validateBarcode, formatDateTime } from '@/utils';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const ScanPage: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const queryRecords = useAppStore((s) => s.queryRecords);
  const addQueryRecord = useAppStore((s) => s.addQueryRecord);
  const currentMemberId = useAppStore((s) => s.currentMemberId);
  const familyMembers = useAppStore((s) => s.familyMembers);
  const setActiveMedicineTab = useAppStore((s) => s.setActiveMedicineTab);
  const currentMember = familyMembers.find((m) => m.id === currentMemberId);

  const handleScan = async () => {
    try {
      const res = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['barCode', 'qrCode'],
      });
      console.log('[Scan] scan result:', res.result);
      processBarcode(res.result, 'scan');
    } catch (err) {
      console.error('[Scan] scan failed:', err);
      Taro.showToast({ title: '扫码已取消', icon: 'none' });
    }
  };

  const processBarcode = (code: string, type: 'scan' | 'manual') => {
    const medicine = mockMedicines.find((m) => m.barcode === code);
    if (!medicine) {
      Taro.showModal({
        title: '未找到药品信息',
        content: `条码 ${code} 未在追溯数据库中登记，请检查条码是否正确或联系药店确认。`,
        showCancel: false,
        confirmText: '我知道了',
      });
      return;
    }

    addQueryRecord({
      id: generateId(),
      medicineId: medicine.id,
      medicineName: medicine.name,
      barcode: code,
      batchNumber: medicine.batchNumber,
      queryTime: formatDateTime(new Date().toISOString()),
      queryType: type,
      authenticity: medicine.authenticity,
      memberId: currentMemberId,
      memberName: currentMember?.name,
    });

    Taro.navigateTo({
      url: `/pages/verify/index?id=${medicine.id}&barcode=${encodeURIComponent(code)}`,
    });
  };

  const handleManualSubmit = () => {
    if (!barcode.trim()) {
      Taro.showToast({ title: '请输入条码', icon: 'none' });
      return;
    }
    if (!validateBarcode(barcode.trim())) {
      Taro.showToast({ title: '条码格式不正确（13位数字）', icon: 'none' });
      return;
    }
    processBarcode(barcode.trim(), 'manual');
  };

  const handleRecordClick = (medicineId: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${medicineId}` });
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'favorites':
        setActiveMedicineTab('favorites');
        Taro.switchTab({ url: '/pages/medicine/index' });
        break;
      case 'nearby':
        Taro.switchTab({ url: '/pages/store/index' });
        break;
      case 'recall': {
        setActiveMedicineTab('recalls');
        Taro.switchTab({ url: '/pages/medicine/index' });
        break;
      }
      case 'help':
        Taro.showModal({
          title: '使用帮助',
          content:
            '1. 点击"扫码核验"扫描药品包装盒上的条码\n2. 或手动输入13位药品条码\n3. 核验成功后可查看药品流通全链路\n4. 如发现异常请及时上报',
          showCancel: false,
        });
        break;
    }
  };

  const stats = {
    total: queryRecords.length,
    authentic: queryRecords.filter((r) => r.authenticity === 'authentic').length,
    abnormal: queryRecords.filter((r) => r.authenticity !== 'authentic').length,
  };

  const recentRecords = queryRecords.slice(0, 5);

  return (
    <ScrollView scrollY className={styles.container} enablePullDownRefresh>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>🔍 药品追溯核验</Text>
        <Text className={styles.headerDesc}>扫码或手动输入条码，查询药品来源与流向</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.actionCard}>
          <Button className={styles.scanBtn} onClick={handleScan}>
            <Text className={styles.scanIcon}>📷</Text>
            <Text className={styles.scanText}>扫码核验药品</Text>
          </Button>

          <View className={styles.manualSection}>
            <Text className={styles.manualLabel}>✏️ 手动输入条码</Text>
            <View className={styles.inputWrapper}>
              <Input
                className={styles.input}
                type="number"
                value={barcode}
                onInput={(e) => setBarcode(e.detail.value)}
                placeholder="请输入13位药品条码"
                maxlength={13}
              />
              <Button className={styles.submitBtn} onClick={handleManualSubmit}>
                查询
              </Button>
            </View>
            <Text className={styles.tip}>
              示例: 8123456789012 (布洛芬), 8123456789023 (阿莫西林), 8123456789034 (感冒灵-含召回)
            </Text>
          </View>
        </View>

        <View className={styles.quickGrid}>
          <View className={styles.quickItem} onClick={() => handleQuickAction('favorites')}>
            <View className={`${styles.quickIcon} ${styles.blue}`}>💊</View>
            <Text className={styles.quickText}>常用药</Text>
          </View>
          <View className={styles.quickItem} onClick={() => handleQuickAction('nearby')}>
            <View className={`${styles.quickIcon} ${styles.green}`}>🏥</View>
            <Text className={styles.quickText}>附近药店</Text>
          </View>
          <View className={styles.quickItem} onClick={() => handleQuickAction('recall')}>
            <View className={`${styles.quickIcon} ${styles.orange}`}>⚠️</View>
            <Text className={styles.quickText}>召回通知</Text>
          </View>
          <View className={styles.quickItem} onClick={() => handleQuickAction('help')}>
            <View className={`${styles.quickIcon} ${styles.purple}`}>❓</View>
            <Text className={styles.quickText}>使用帮助</Text>
          </View>
        </View>

        <View className={styles.statCard}>
          <View className={styles.statGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statNum}>{stats.total}</Text>
              <Text className={styles.statLabel}>总核验次数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNum} style={{ color: '#10B981' }}>
                {stats.authentic}
              </Text>
              <Text className={styles.statLabel}>正品通过</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNum} style={{ color: '#F59E0B' }}>
                {stats.abnormal}
              </Text>
              <Text className={styles.statLabel}>异常提示</Text>
            </View>
          </View>
        </View>

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>📋 最近核验记录</Text>
          {recentRecords.length > 0 && (
            <Text
              className={styles.sectionMore}
              onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}
            >
              查看全部 →
            </Text>
          )}
        </View>

        {recentRecords.length === 0 ? (
          <EmptyState
            icon="📄"
            title="暂无核验记录"
            desc="扫描药品条码或手动输入开始核验"
          />
        ) : (
          recentRecords.map((record) => (
            <View
              key={record.id}
              className={styles.recordCard}
              onClick={() => handleRecordClick(record.medicineId)}
            >
              <View className={styles.recordIcon}>
                {record.queryType === 'scan' ? '📷' : '⌨️'}
              </View>
              <View className={styles.recordInfo}>
                <Text className={styles.recordName}>{record.medicineName}</Text>
                <View className={styles.recordMeta}>
                  {record.memberName && (
                    <View className={styles.memberTag}>{record.memberName}</View>
                  )}
                  <Text>
                    {record.queryType === 'scan' ? '扫码' : '手输'} · {record.queryTime}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default ScanPage;
