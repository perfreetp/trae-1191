import React, { useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore, mockMedicines } from '@/store/useAppStore';
import StatusTag from '@/components/StatusTag';
import { getExpiryStatus, getAuthenticityLabel, formatDate } from '@/utils';
import styles from './index.module.scss';

const VerifyPage: React.FC = () => {
  const router = useRouter();
  const medicineId = router.params.id || 'med1';
  const barcode = router.params.barcode ? decodeURIComponent(router.params.barcode) : '';
  const getBarcodeQueryInfo = useAppStore((s) => s.getBarcodeQueryInfo);

  const medicine = useMemo(
    () => mockMedicines.find((m) => m.id === medicineId) || mockMedicines[0],
    [medicineId]
  );

  const auth = getAuthenticityLabel(medicine.authenticity);
  const expiry = getExpiryStatus(medicine.expiryDate);

  const barcodeInfo = useMemo(() => {
    if (barcode) return getBarcodeQueryInfo(barcode);
    const fallback = medicine.barcode ? getBarcodeQueryInfo(medicine.barcode) : null;
    return fallback || { count: 1, lastTime: null };
  }, [barcode, medicine.barcode, getBarcodeQueryInfo]);

  const currentBarcode = barcode || medicine.barcode;
  const queryCountThis = barcodeInfo.count;
  const lastQueryTime = barcodeInfo.lastTime;
  const isRepeatedQuery = queryCountThis >= 2;
  const isHighRepeatedQuery = queryCountThis >= 5;

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
    const repeatLine =
      queryCountThis >= 2
        ? `当前包装码已查询: 第${queryCountThis}次${lastQueryTime ? `(上次:${lastQueryTime})` : ''}\n`
        : '';
    const text = `【药品核验报告】\n药品名称: ${medicine.name}\n批准文号: ${medicine.approvalNumber}\n批号: ${medicine.batchNumber}\n追溯包装码: ${currentBarcode}\n核验结果: ${auth.label}\n当前包装码查询次数: 第${queryCountThis}次\n${repeatLine}累计批次查询: ${medicine.queryCount}次\n当前状态: ${expiry.label}\n--- 来自药品追溯小程序`;
    Taro.setClipboardData({
      data: text,
      success: () => Taro.showToast({ title: '核验结果已复制', icon: 'success' }),
    });
  };

  const isAuthentic = medicine.authenticity === 'authentic';
  const isExpired = expiry.status === 'expired';
  const isNearExpiry = expiry.status === 'near';
  const isHighBatchQuery = medicine.queryCount > 200;
  const hasWarning =
    !isAuthentic || isExpired || isNearExpiry || isHighBatchQuery || isRepeatedQuery;

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
        {currentBarcode && (
          <View className={styles.queryInfo}>
            <View className={styles.queryChip}>
              <Text className={styles.queryChipLabel}>当前包装码</Text>
              <Text className={styles.queryChipValue}>{currentBarcode}</Text>
            </View>
            <View className={classnames(styles.queryChip, isRepeatedQuery && styles.warn)}>
              <Text className={styles.queryChipLabel}>第</Text>
              <Text className={styles.queryChipBig}>{queryCountThis}</Text>
              <Text className={styles.queryChipLabel}>次查询</Text>
            </View>
            {lastQueryTime && (
              <View className={classnames(styles.queryChip, styles.muted)}>
                <Text className={styles.queryChipLabel}>上次:</Text>
                <Text className={styles.queryChipValue}>{lastQueryTime}</Text>
              </View>
            )}
          </View>
        )}
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
                  • 药品已过期
                  {Math.abs(expiry.label.match(/\d+/)?.[0] || 0)}天，禁止使用
                  {'\n'}
                </Text>
              )}
              {isNearExpiry && !isExpired && (
                <Text>
                  • 药品距效期不足90天，请尽快使用或咨询药师
                  {'\n'}
                </Text>
              )}
              {isHighRepeatedQuery && (
                <Text>
                  ⚠️ 高风险: 当前包装码已被查询 <Text style={{ fontWeight: 700 }}>{queryCountThis}</Text> 次，
                  如非本人多次查询请立即联系12315或药店核实（涉嫌重复包装/假冒）
                  {'\n'}
                </Text>
              )}
              {isRepeatedQuery && !isHighRepeatedQuery && (
                <Text>
                  • 该包装码已查询 <Text style={{ fontWeight: 600 }}>{queryCountThis}</Text> 次
                  {lastQueryTime ? `（上次 ${lastQueryTime}）` : ''}，请确认是否为您本人操作
                  {'\n'}
                </Text>
              )}
              {isHighBatchQuery && isAuthentic && !isHighRepeatedQuery && (
                <Text>
                  • 该批次药品已被累计查询{medicine.queryCount}次，如非本人多次查询请留意
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
                {isRepeatedQuery && (
                  <StatusTag type={isHighRepeatedQuery ? 'error' : 'warning'} text={`第${queryCountThis}次查`} />
                )}
              </View>
            </View>
          </View>

          <View className={styles.statsGrid}>
            <View className={styles.statBox}>
              <Text
                className={classnames(styles.statNum, isHighBatchQuery && styles.warning)}
              >
                {medicine.queryCount}
              </Text>
              <Text className={styles.statLabel}>批次累计查询</Text>
            </View>
            <View
              className={classnames(
                styles.statBox,
                (isRepeatedQuery || isHighRepeatedQuery) && styles.statBoxWarn
              )}
            >
              <Text
                className={classnames(
                  styles.statNum,
                  (isRepeatedQuery || isHighRepeatedQuery) && styles.danger
                )}
              >
                第{queryCountThis}次
              </Text>
              <Text className={styles.statLabel}>
                {lastQueryTime ? `上次: ${lastQueryTime}` : '首查包装码'}
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
              <Text className={styles.detailLabel}>追溯包装码</Text>
              <Text
                className={classnames(
                  styles.detailValue,
                  styles.detailMono,
                  isRepeatedQuery && styles.danger
                )}
                onLongPress={() => {
                  Taro.setClipboardData({ data: currentBarcode });
                  Taro.showToast({ title: '包装码已复制', icon: 'success' });
                }}
              >
                {currentBarcode}
              </Text>
            </View>
            <View className={styles.detailRow}>
              <Text className={styles.detailLabel}>包装码查询次数</Text>
              <Text
                className={classnames(
                  styles.detailValue,
                  isRepeatedQuery && styles.danger
                )}
              >
                第{queryCountThis}次{lastQueryTime ? ` · 上次: ${lastQueryTime}` : ''}
              </Text>
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
              同一包装码多次异常查询请立即拨打 12315
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={`${styles.btn} ${styles.secondary}`} onClick={handleShare}>
          🔗 分享
        </Button>
        {(!isAuthentic || isRepeatedQuery) && (
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
