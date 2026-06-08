import React, { useState } from 'react';
import { View, Text, Button, Input, Textarea, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import EmptyState from '@/components/EmptyState';
import { getReportTypeLabel, getReportStatusLabel, generateId, formatDateTime } from '@/utils';
import type { AbnormalReport } from '@/types';
import styles from './index.module.scss';

type ReportType = 'damage' | 'counterfeit' | 'expired' | 'other';
type TabType = 'submit' | 'list';

const reportTypes: { type: ReportType; icon: string; label: string }[] = [
  { type: 'damage', icon: '📦', label: '包装破损' },
  { type: 'counterfeit', icon: '⚠️', label: '疑似假药' },
  { type: 'expired', icon: '⏰', label: '过期药品' },
  { type: 'other', icon: '❓', label: '其他问题' },
];

const ReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('submit');
  const [reportType, setReportType] = useState<ReportType>('damage');
  const [medicineName, setMedicineName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('张先生');
  const [reporterPhone, setReporterPhone] = useState('138****8888');
  const [images, setImages] = useState<string[]>([]);

  const reports = useAppStore((s) => s.reports);
  const addReport = useAppStore((s) => s.addReport);

  const handleUpload = async () => {
    if (images.length >= 6) {
      Taro.showToast({ title: '最多上传6张图片', icon: 'none' });
      return;
    }
    try {
      const res = await Taro.chooseImage({
        count: 6 - images.length,
      });
      setImages([...images, ...res.tempFilePaths]);
    } catch (err) {
      console.error('[Report] upload failed', err);
    }
  };

  const handleDeleteImg = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      Taro.showToast({ title: '请填写问题描述', icon: 'none' });
      return;
    }

    const newReport: AbnormalReport = {
      id: generateId(),
      type: reportType,
      status: 'pending',
      medicineName: medicineName || undefined,
      batchNumber: batchNumber || undefined,
      storeName: storeName || undefined,
      description: description.trim(),
      images,
      reporterName,
      reporterPhone,
      submitTime: formatDateTime(new Date().toISOString()),
    };

    addReport(newReport);
    Taro.showToast({ title: '上报成功', icon: 'success' });

    setMedicineName('');
    setBatchNumber('');
    setStoreName('');
    setDescription('');
    setImages([]);
    setActiveTab('list');
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View
        style={{
          display: 'flex',
          gap: 16,
          padding: '32rpx 32rpx 0',
        }}
      >
        <Button
          onClick={() => setActiveTab('submit')}
          style={{
            flex: 1,
            height: 64,
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'submit' ? '#0EA5E9' : '#fff',
            color: activeTab === 'submit' ? '#fff' : '#475569',
            fontSize: 28,
            fontWeight: 500,
          }}
        >
          我要上报
        </Button>
        <Button
          onClick={() => setActiveTab('list')}
          style={{
            flex: 1,
            height: 64,
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'list' ? '#0EA5E9' : '#fff',
            color: activeTab === 'list' ? '#fff' : '#475569',
            fontSize: 28,
            fontWeight: 500,
          }}
        >
          上报记录 ({reports.length})
        </Button>
      </View>

      {activeTab === 'submit' && (
        <View className={styles.formCard}>
          <Text className={styles.sectionTitle}>📝 选择异常类型</Text>
          <View className={styles.typeGrid}>
            {reportTypes.map((item) => (
              <View
                key={item.type}
                className={classnames(styles.typeCard, reportType === item.type && styles.active)}
                onClick={() => setReportType(item.type)}
              >
                <View className={classnames(styles.typeIcon, styles[item.type])}>
                  {item.icon}
                </View>
                <Text className={styles.typeLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text className={styles.sectionTitle}>📋 填写信息</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>药品名称</Text>
            <Input
              className={styles.input}
              value={medicineName}
              onInput={(e) => setMedicineName(e.detail.value)}
              placeholder="请输入药品名称（选填）"
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>生产批号</Text>
            <Input
              className={styles.input}
              value={batchNumber}
              onInput={(e) => setBatchNumber(e.detail.value)}
              placeholder="请输入药品批号（选填）"
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>购买门店</Text>
            <Input
              className={styles.input}
              value={storeName}
              onInput={(e) => setStoreName(e.detail.value)}
              placeholder="请输入购买的药店名称（选填）"
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              问题描述
              <Text className={styles.required}>*</Text>
            </Text>
            <Textarea
              className={styles.textarea}
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              placeholder="请详细描述您遇到的问题，如药品外观异常、包装破损、疑似假药等情况..."
              maxlength={500}
            />
            <Text style={{ fontSize: 20, color: '#94A3B8', marginTop: 8, textAlign: 'right' }}>
              {description.length}/500
            </Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>上传凭证 (最多6张)</Text>
            <View className={styles.uploadGrid}>
              {images.map((img, i) => (
                <View key={i} className={styles.uploadItem}>
                  <Image className={styles.uploadedImg} src={img} mode="aspectFill" />
                  <Button className={styles.deleteBtn} onClick={() => handleDeleteImg(i)}>
                    ✕
                  </Button>
                </View>
              ))}
              {images.length < 6 && (
                <View className={styles.uploadItem}>
                  <Button className={styles.addImgBtn} onClick={handleUpload}>
                    <Text style={{ fontSize: 48 }}>+</Text>
                    <Text className={styles.addImgText}>添加图片</Text>
                  </Button>
                </View>
              )}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>您的姓名</Text>
            <Input
              className={styles.input}
              value={reporterName}
              onInput={(e) => setReporterName(e.detail.value)}
              placeholder="请输入您的姓名"
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>联系电话</Text>
            <Input
              className={styles.input}
              type="number"
              value={reporterPhone}
              onInput={(e) => setReporterPhone(e.detail.value)}
              placeholder="请输入联系电话"
              maxlength={11}
            />
          </View>
        </View>
      )}

      {activeTab === 'submit' && (
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          ✅ 提交上报
        </Button>
      )}

      {activeTab === 'list' && (
        <View className={styles.content}>
          {reports.length === 0 ? (
            <EmptyState
              icon="📭"
              title="暂无上报记录"
              desc="如发现药品异常，请及时上报维护自身权益"
            />
          ) : (
            reports.map((report) => {
              const statusInfo = getReportStatusLabel(report.status);
              return (
                <View key={report.id} className={styles.statusCard}>
                  <View className={styles.statusHeader}>
                    <View className={styles.statusLeft}>
                      <Text className={styles.statusType}>
                        {report.type === 'damage'
                          ? '📦'
                          : report.type === 'counterfeit'
                          ? '⚠️'
                          : report.type === 'expired'
                          ? '⏰'
                          : '❓'}
                        {getReportTypeLabel(report.type)}
                      </Text>
                      <Text className={styles.statusTime}>
                        提交时间: {report.submitTime}
                      </Text>
                    </View>
                    <View
                      className={classnames(styles.statusTag, styles[report.status])}
                      style={{
                        background:
                          statusInfo.color === 'warning'
                            ? '#FEF3C7'
                            : statusInfo.color === 'success'
                            ? '#D1FAE5'
                            : statusInfo.color === 'error'
                            ? '#FEE2E2'
                            : '#E0F2FE',
                        color:
                          statusInfo.color === 'warning'
                            ? '#F59E0B'
                            : statusInfo.color === 'success'
                            ? '#10B981'
                            : statusInfo.color === 'error'
                            ? '#EF4444'
                            : '#0EA5E9',
                      }}
                    >
                      {statusInfo.label}
                    </View>
                  </View>
                  <View className={styles.statusBody}>
                    <Text className={styles.statusDesc}>{report.description}</Text>
                    <View style={{ height: 16 }} />
                    <View className={styles.statusMeta}>
                      {report.medicineName && <Text>药品: {report.medicineName}</Text>}
                      {report.batchNumber && <Text>批号: {report.batchNumber}</Text>}
                      {report.storeName && <Text>门店: {report.storeName}</Text>}
                      <Text>联系人: {report.reporterName}</Text>
                    </View>
                  </View>
                  {report.replyContent && (
                    <View className={styles.statusReply}>
                      <Text className={styles.replyLabel}>📢 官方回复</Text>
                      <Text className={styles.replyContent}>{report.replyContent}</Text>
                      <Text className={styles.replyTime}>
                        回复时间: {report.updateTime}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default ReportPage;
