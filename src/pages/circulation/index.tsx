import React, { useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { mockMedicines, mockCirculation } from '@/store/useAppStore';
import TimelineNode from '@/components/TimelineNode';
import EmptyState from '@/components/EmptyState';
import { formatDate } from '@/utils';
import styles from './index.module.scss';

const CirculationPage: React.FC = () => {
  const router = useRouter();
  const medicineId = router.params.id || 'med1';

  const medicine = useMemo(
    () => mockMedicines.find((m) => m.id === medicineId) || mockMedicines[0],
    [medicineId]
  );

  const nodes = mockCirculation[medicineId] || [];

  const handleVerify = () => {
    Taro.navigateTo({ url: `/pages/verify/index?id=${medicine.id}` });
  };

  const handleCopyCode = () => {
    Taro.setClipboardData({
      data: medicine.barcode,
      success: () => Taro.showToast({ title: '条码已复制', icon: 'success' }),
    });
  };

  const getNodeCount = () => {
    const counts = { manufacturer: 0, wholesaler: 0, retailer: 0, consumer: 0 };
    nodes.forEach((n) => counts[n.type]++);
    return counts;
  };

  const nodeCounts = getNodeCount();

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.summaryCard}>
        <View className={styles.medicineRow}>
          <Image className={styles.image} src={medicine.image} mode="aspectFill" />
          <View className={styles.info}>
            <Text className={styles.name}>{medicine.name}</Text>
            <View className={styles.meta}>
              <Text>📦 {medicine.batchNumber}</Text>
              <Text>📅 有效期至 {formatDate(medicine.expiryDate)}</Text>
            </View>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{nodeCounts.manufacturer}</Text>
            <Text className={styles.statLabel}>生产企业</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{nodeCounts.wholesaler}</Text>
            <Text className={styles.statLabel}>批发企业</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{nodes.length}</Text>
            <Text className={styles.statLabel}>流通节点</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={`${styles.legendDot} ${styles.manufacturer}`} />
            <Text>生产企业</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={`${styles.legendDot} ${styles.wholesaler}`} />
            <Text>批发企业</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={`${styles.legendDot} ${styles.retailer}`} />
            <Text>零售药店</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={`${styles.legendDot} ${styles.consumer}`} />
            <Text>消费者</Text>
          </View>
        </View>

        <Text className={styles.sectionTitle}>🔗 全链路流通节点</Text>

        {nodes.length === 0 ? (
          <EmptyState icon="📭" title="暂无流通记录" />
        ) : (
          <View className={styles.timelineCard}>
            {nodes.map((node, index) => (
              <TimelineNode
                key={node.id}
                node={node}
                isLast={index === nodes.length - 1}
              />
            ))}
          </View>
        )}

        {nodes.length > 0 && (
          <View className={styles.endpoint}>
            <View className={styles.endpointHeader}>
              <Text className={styles.endpointTitle}>🏷️ 追溯标识码</Text>
              <View className={styles.endpointTag}>✓ 上链存证</View>
            </View>
            <View className={styles.codeBox}>
              <Text className={styles.codeLabel}>药品追溯条码（可扫码验证）</Text>
              <Text className={styles.codeValue}>{medicine.barcode}</Text>
            </View>
            <View className={styles.actionRow}>
              <Button
                className={`${styles.actionBtn} ${styles.secondary}`}
                onClick={handleCopyCode}
              >
                📋 复制条码
              </Button>
              <Button
                className={`${styles.actionBtn} ${styles.primary}`}
                onClick={handleVerify}
              >
                ✅ 核验真伪
              </Button>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default CirculationPage;
