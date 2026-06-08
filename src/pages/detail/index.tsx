import React, { useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore, mockMedicines, mockCirculation } from '@/store/useAppStore';
import StatusTag from '@/components/StatusTag';
import { getExpiryStatus, formatDate, getAuthenticityLabel } from '@/utils';
import styles from './index.module.scss';

const DetailPage: React.FC = () => {
  const router = useRouter();
  const medicineId = router.params.id || 'med1';

  const medicine = useMemo(
    () => mockMedicines.find((m) => m.id === medicineId) || mockMedicines[0],
    [medicineId]
  );

  const circulationNodes = mockCirculation[medicineId] || [];
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const isFavorited = favorites.includes(medicine.id);
  const expiry = getExpiryStatus(medicine.expiryDate);
  const auth = getAuthenticityLabel(medicine.authenticity);

  const handleViewCirculation = () => {
    Taro.navigateTo({ url: `/pages/circulation/index?id=${medicine.id}` });
  };

  const handleVerify = () => {
    Taro.navigateTo({ url: `/pages/verify/index?id=${medicine.id}` });
  };

  const handleShare = () => {
    Taro.showActionSheet({
      itemList: ['复制核验结果', '生成分享海报', '发送给朋友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          const text = `【药品核验】${medicine.name}\n批准文号: ${medicine.approvalNumber}\n批号: ${medicine.batchNumber}\n生产企业: ${medicine.manufacturer}\n有效期至: ${medicine.expiryDate}\n核验结果: ${auth.label}\n--- 来自药品追溯小程序`;
          Taro.setClipboardData({
            data: text,
            success: () => Taro.showToast({ title: '已复制', icon: 'success' }),
          });
        } else {
          Taro.showToast({ title: '功能开发中', icon: 'none' });
        }
      },
    });
  };

  const handleReport = () => {
    Taro.switchTab({ url: '/pages/report/index' });
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.heroCard}>
        <View className={styles.heroInner}>
          <Image className={styles.image} src={medicine.image} mode="aspectFill" />
          <View className={styles.info}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{medicine.name}</Text>
              <Button
                className={classnames(styles.favBtn, isFavorited && styles.favorited)}
                onClick={() => toggleFavorite(medicine.id)}
              >
                {isFavorited ? '❤️' : '🤍'}
              </Button>
            </View>
            <Text className={styles.genericName}>{medicine.genericName}</Text>
            <View style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <View className={styles.categoryBadge}>📌 {medicine.category}</View>
              <StatusTag
                type={auth.color === 'success' ? 'success' : 'warning'}
                text={auth.label}
              />
              <StatusTag type={expiry.color} text={expiry.label} />
            </View>
          </View>
        </View>

        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>批准文号</Text>
            <Text className={styles.infoValue}>{medicine.approvalNumber}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>产品批号</Text>
            <Text className={styles.infoValue}>{medicine.batchNumber}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>生产日期</Text>
            <Text className={styles.infoValue}>{formatDate(medicine.productionDate)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>有效期至</Text>
            <Text className={styles.infoValue}>{formatDate(medicine.expiryDate)}</Text>
          </View>
          <View className={classnames(styles.infoItem, styles.fullWidth)}>
            <Text className={styles.infoLabel}>规格</Text>
            <Text className={styles.infoValue}>{medicine.specification}</Text>
          </View>
        </View>
      </View>

      {medicine.recallNotice && (
        <View className={styles.content}>
          <View className={styles.recallBanner}>
            <View
              className={classnames(
                styles.recallLevel,
                medicine.recallNotice.level === 'medium' && styles.medium,
                medicine.recallNotice.level === 'low' && styles.low
              )}
            >
              {medicine.recallNotice.level === 'high'
                ? '🔴 一级召回'
                : medicine.recallNotice.level === 'medium'
                ? '🟠 二级召回'
                : '🔵 三级召回'}
            </View>
            <Text className={styles.recallTitle}>{medicine.recallNotice.title}</Text>
            <Text className={styles.recallContent}>{medicine.recallNotice.content}</Text>
            <View
              className={styles.recallAction}
              onClick={() => Taro.showToast({ title: '联系客服处理', icon: 'none' })}
            >
              查看召回处理方案 →
            </View>
          </View>
        </View>
      )}

      <View className={styles.content}>
        <View
          className={styles.section}
          onClick={handleViewCirculation}
        >
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>🔄 流通溯源节点</Text>
            <Text className={styles.chevron}>
              {circulationNodes.length}个节点 ›
            </Text>
          </View>
          <View style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {circulationNodes.slice(0, 4).map((node, i) => (
              <View key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    background:
                      node.type === 'manufacturer'
                        ? '#E0F2FE'
                        : node.type === 'wholesaler'
                        ? '#EDE9FE'
                        : node.type === 'retailer'
                        ? '#D1FAE5'
                        : '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  {node.type === 'manufacturer'
                    ? '🏭'
                    : node.type === 'wholesaler'
                    ? '📦'
                    : node.type === 'retailer'
                    ? '🏪'
                    : '🧑'}
                </View>
                {i < circulationNodes.slice(0, 4).length - 1 && i < 3 && (
                  <View
                    style={{
                      width: 24,
                      height: 2,
                      background: '#E2E8F0',
                      margin: '0 -4px',
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>🏭 生产信息</Text>
          <View style={{ height: 16 }} />
          <View className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>生产企业</Text>
            <Text className={styles.fieldValue}>{medicine.manufacturer}</Text>
          </View>
          <View className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>企业地址</Text>
            <Text className={styles.fieldValue}>{medicine.manufacturerAddress}</Text>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>💊 用法用量</Text>
          <View style={{ height: 16 }} />
          <View className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>用法</Text>
            <Text className={styles.fieldValue}>{medicine.usage}</Text>
          </View>
          <View className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>用量</Text>
            <Text className={styles.fieldValue}>{medicine.dosage}</Text>
          </View>
          <View className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>适应症</Text>
            <Text className={styles.fieldValue}>{medicine.indication}</Text>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>📊 核验统计</Text>
          <View style={{ height: 16 }} />
          <View className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>累计查询</Text>
            <Text className={styles.fieldValue}>{medicine.queryCount} 次</Text>
          </View>
          {medicine.lastQueryTime && (
            <View className={styles.fieldRow}>
              <Text className={styles.fieldLabel}>上次查询</Text>
              <Text className={styles.fieldValue}>{medicine.lastQueryTime}</Text>
            </View>
          )}
          <View className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>条码编号</Text>
            <Text className={styles.fieldValue}>{medicine.barcode}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleShare}>
          🔗 分享
        </Button>
        <Button
          className={styles.secondaryBtn}
          onClick={handleReport}
          style={{ background: '#FEF3C7', color: '#F59E0B', flex: 1 }}
        >
          ⚠️ 异常上报
        </Button>
        <Button className={styles.primaryBtn} onClick={handleVerify}>
          ✅ 查看核验结果
        </Button>
      </View>
    </ScrollView>
  );
};

export default DetailPage;
