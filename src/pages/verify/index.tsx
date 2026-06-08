import React, { useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { mockMedicines } from '@/store/useAppStore';
import StatusTag from '@/components/StatusTag';
import { getExpiryStatus, getAuthenticityLabel, formatDate } from '@/utils';
import styles from './index.module.scss';

const VerifyPage: React.FC = () => {
  const router = useRouter();
  const medicineId = router.params.id || 'med1';

  const medicine = useMemo(
    () => mockMedicines.find((m) => m.id === medicineId) || mockMedicines[0],
    [medicineId]
  );

  const auth = getAuthenticityLabel(medicine.authenticity);
  const expiry = getExpiryStatus(medicine.expiryDate);

  const handleViewDetail = () => {
    Taro.redirectTo({ url: `/pages/detail/index?id=${medicine.id}` });
  };

  const handleViewCirculation = () => {
    Taro.navigateTo({ url: `/pages/circulation/index?id=${medicine.id}` });
  };

  const handleReport = () => {
    Taro.switchTab({ url: '/pages/report/index' });
  };

  const handleShare = () => {
    const text = `【药品核验报告】\n药品名称: ${medicine.name}\n批准文号: ${medicine.approvalNumber}\n批号: ${medicine.batchNumber}\n核验结果: ${auth.label}\n累计查询: ${medicine.queryCount}次\n当前状态: ${expiry.label}\n--- 来自药品追溯小程序`;
    Taro.setClipboardData({
      data: text,
      success: () => Taro.showToast({ title: '核验结果已复制', icon: 'success' }),
    });
  };

  const isAuthentic = medicine.authenticity === 'authentic';
  const isExpired = expiry.status === 'expired';
  const isNearExpiry = expiry.status === 'near';
  const isHighQuery = medicine.queryCount > 200;
  const hasWarning = !isAuthentic || isExpired || isNearExpiry || isHighQuery;

  return (
    <ScrollView scrollY className={styles.container}>
      <View
        className={classnames(
          styles.resultBanner,
          isAuthentic ? styles.authentic : styles.suspected
        )}
      >
        <View className={styles.iconWrap}>
          {isAuthentic ? '✅' : '⚠️'}
        </View>
        <Text className={styles.resultTitle}>
          {isAuthentic ? '正品溯源核验通过' : '核验结果存在异常'}
        </Text>
        <Text className={styles.resultDesc}>
          {isAuthentic
            ? '该药品信息已在国家药品追溯平台登记，流通链路完整可信'
            : '该药品存在异常情况，请仔细核对并谨慎使用'}
        </Text>
      </View>

      <View className={styles.content}>
        {hasWarning && (
          <View className={styles.warningCard}>
            <Text className={styles.warningTitle}>⚠️ 风险提示</Text>
            <View className={classnames(styles.warningText)}>
              {!isAuthentic && (
                <Text>
                  • 该药品溯源信息存在异常标记，建议联系购买门店或拨打12315核实
                  {'\n'}
                </Text>
              )}
              {isExpired && (
                <Text>
                  • 药品已过期{Math.abs(expiry.label.match(/\d+/)?.[0] || 0)}天，禁止使用
                  {'\n'}
                </Text>
              )}
              {isNearExpiry && !isExpired && (
                <Text>
                  • 药品距效期不足90天，请尽快使用或咨询药师
                  {'\n'}
                </Text>
              )}
              {isHighQuery && isAuthentic && (
                <Text>
                  • 该批次药品已被查询{medicine.queryCount}次，如非本人多次查询请留意
                  {'\n'}
                </Text>
              )}
              {medicine.recallNotice && (
                <Text>• 该批次药品有召回通知，请查看详情了解处理方案</Text>
              )}
            </View>
          </View>
        )}

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>💊 药品信息</Text>
          <View className={styles.medicineRow}>
            <Image className={styles.image} src={medicine.image} mode="aspectFill" />
            <View className={styles.medInfo}>
              <Text className={styles.medName}>{medicine.name}</Text>
              <View className={styles.medMeta}>
                <Text>📌 {medicine.category}</Text>
                <StatusTag
                  type={auth.color === 'success' ? 'success' : 'warning'}
                  text={auth.label}
                />
                <StatusTag type={expiry.color} text={expiry.label} />
              </View>
            </View>
          </View>

          <View className={styles.statsGrid}>
            <View className={styles.statBox}>
              <Text
                className={classnames(styles.statNum, isHighQuery && styles.warning)}
              >
                {medicine.queryCount}
              </Text>
              <Text className={styles.statLabel}>累计查询次数</Text>
            </View>
            <View className={styles.statBox}>
              <Text className={styles.statNum}>
                {medicine.lastQueryTime ? '已查询' : '首次'}
              </Text>
              <Text className={styles.statLabel}>
                {medicine.lastQueryTime || '恭喜您是首查'}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>📋 核验详情</Text>
          <View className={styles.detailList}>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>批准文号</Text>
              <Text className={styles.detailValue}>{medicine.approvalNumber}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>产品批号</Text>
              <Text className={styles.detailValue}>{medicine.batchNumber}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>生产日期</Text>
              <Text className={styles.detailValue}>{formatDate(medicine.productionDate)}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>有效期至</Text>
              <Text className={styles.detailValue}>{formatDate(medicine.expiryDate)}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>生产企业</Text>
              <Text className={styles.detailValue}>{medicine.manufacturer}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>追溯条码</Text>
              <Text className={styles.detailValue}>{medicine.barcode}</Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>核验时间</Text>
              <Text className={styles.detailValue}>
                {new Date().toLocaleString('zh-CN')}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.safetyTips}>
          <Text className={styles.tipTitle}>🛡️ 安全用药小贴士</Text>
          <View className={styles.tipList}>
            <Text className={styles.tipItem}>购买药品请选择正规药店或医院</Text>
            <Text className={styles.tipItem}>服药前请仔细阅读药品说明书</Text>
            <Text className={styles.tipItem}>处方药请凭执业医师处方购买使用</Text>
            <Text className={styles.tipItem}>
              如对药品有疑问，请咨询执业药师或拨打12315
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={`${styles.btn} ${styles.secondary}`} onClick={handleShare}>
          🔗 分享
        </Button>
        {!isAuthentic && (
          <Button className={`${styles.btn} ${styles.warning}`} onClick={handleReport}>
            ⚠️ 异常上报
          </Button>
        )}
        <Button
          className={`${styles.btn} ${styles.primary}`}
          onClick={isAuthentic ? handleViewCirculation : handleViewDetail}
          style={{ flex: isAuthentic ? 1.5 : 1 }}
        >
          {isAuthentic ? '🔄 查看流通链路' : '📄 查看详情'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default VerifyPage;
