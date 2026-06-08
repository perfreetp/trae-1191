import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import EmptyState from '@/components/EmptyState';
import StatusTag from '@/components/StatusTag';
import { getAuthenticityLabel } from '@/utils';
import type { MedicationLog } from '@/types';
import styles from './index.module.scss';

const todayISO = () => new Date().toISOString().split('T')[0];
const addDays = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
const prettyDate = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
};
const weekdayCN = (iso: string) => {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return '周' + days[new Date(iso).getDay()];
};

type FilterType = 'all' | string;

const ProfilePage: React.FC = () => {
  const familyMembers = useAppStore((s) => s.familyMembers);
  const currentMemberId = useAppStore((s) => s.currentMemberId);
  const setCurrentMemberId = useAppStore((s) => s.setCurrentMemberId);
  const queryRecords = useAppStore((s) => s.queryRecords);
  const storeRecords = useAppStore((s) => s.storeRecords);
  const reports = useAppStore((s) => s.reports);
  const reminders = useAppStore((s) => s.reminders);
  const favorites = useAppStore((s) => s.favorites);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const getLowInventories = useAppStore((s) => s.getLowInventories);
  const lowInventories = useMemo(() => getLowInventories(), [getLowInventories]);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const stats = {
    queries: queryRecords.length,
    favorites: favorites.length,
    reports: reports.length,
    reminders: reminders.length,
  };

  const filterOptions = useMemo(
    () => [
      { key: 'all', label: '全部' },
      ...familyMembers.map((m) => ({ key: m.id, label: m.name })),
    ],
    [familyMembers]
  );

  const filteredRecords = useMemo(() => {
    if (activeFilter === 'all') return queryRecords;
    return queryRecords.filter((r) => r.memberId === activeFilter);
  }, [queryRecords, activeFilter]);

  const handleExport = () => {
    const totalAmount = storeRecords.reduce((sum, r) => sum + r.totalPrice, 0);
    const hasReceiptCount = storeRecords.filter(
      (r) =>
        (r.receipts && r.receipts.length > 0) ||
        (r.receiptImages && r.receiptImages.length > 0)
    ).length;
    const medicineList = storeRecords
      .map((r, i) => {
        const has =
          (r.receipts && r.receipts.length > 0) ||
          (r.receiptImages && r.receiptImages.length > 0);
        const tag = has ? ` 🧾有票据` : '';
        return `${i + 1}. ${r.medicineName} × ${r.quantity} (${r.batchNumber || '—'})${tag} - ¥${r.totalPrice.toFixed(2)}`;
      })
      .join('\n');

    Taro.setClipboardData({
      data: `【购药清单】\n记录数量: ${storeRecords.length}笔\n累计金额: ¥${totalAmount.toFixed(2)}\n含票据: ${hasReceiptCount}笔\n\n明细:\n${medicineList}\n\n--- 来自药品追溯小程序 ---`,
      success: () => {
        Taro.showToast({ title: '清单已复制', icon: 'success' });
      },
    });
  };

  const handleShare = () => {
    Taro.showActionSheet({
      itemList: ['分享最近核验结果', '生成图片海报', '复制分享链接'],
      success: (res) => {
        if (res.tapIndex === 2) {
          Taro.setClipboardData({
            data: '药品追溯小程序 - 专业的药品溯源核验工具，扫码即可查真伪、看流向，保障家庭用药安全！',
            success: () => Taro.showToast({ title: '链接已复制', icon: 'success' }),
          });
        } else {
          Taro.showToast({ title: '功能开发中', icon: 'none' });
        }
      },
    });
  };

  const medStats7d = useMemo(() => {
    const today = todayISO();
    const days: Array<{
      date: string;
      total: number;
      taken: number;
      skipped: number;
    }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const logs = medicationLogs.filter((l) => l.date === d);
      const total = logs.length;
      const taken = logs.filter((l) => l.status === 'taken').length;
      const skipped = logs.filter((l) => l.status === 'skipped').length;
      days.push({ date: d, total, taken, skipped });
    }
    const totalAll = days.reduce((s, d) => s + d.total, 0);
    const takenAll = days.reduce((s, d) => s + d.taken, 0);
    return {
      days,
      totalAll,
      takenAll,
      rate: totalAll === 0 ? 0 : Math.round((takenAll / totalAll) * 100),
    };
  }, [medicationLogs]);

  const handleRecordClick = (medicineId: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${medicineId}` });
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.header}>
        <View className={styles.userRow}>
          <View className={styles.avatar}>👤</View>
          <View className={styles.userInfo}>
            <Text className={styles.userName}>张先生</Text>
            <Text className={styles.userDesc}>
              <View className={styles.verifyBadge}>✓ 已实名认证</View>
              <View className={styles.memberBadge}>👨‍👩‍👧 家庭管理员</View>
            </Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.queries}</Text>
            <Text className={styles.statLabel}>核验次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.favorites}</Text>
            <Text className={styles.statLabel}>收藏药品</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.reminders}</Text>
            <Text className={styles.statLabel}>用药提醒</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.reports}</Text>
            <Text className={styles.statLabel}>异常上报</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.medStatsCard}>
          <View className={styles.medStatsHeader}>
            <View>
              <Text className={styles.medStatsTitle}>💊 近 7 天服药完成</Text>
              <Text className={styles.medStatsSub}>
                坚持打卡，用药更规律
              </Text>
            </View>
            <View className={styles.medStatsRate}>
              <Text className={styles.rateNum}>{medStats7d.rate}</Text>
              <Text className={styles.rateUnit}>%</Text>
            </View>
          </View>
          <View className={styles.medStatsDays}>
            {medStats7d.days.map((d) => {
              const bar =
                d.total === 0 ? 0 : Math.round((d.taken / d.total) * 100);
              return (
                <View key={d.date} className={styles.medDay}>
                  <View className={styles.medDayBar}>
                    <View
                      className={styles.medDayFill}
                      style={{ height: `${Math.max(4, bar)}%` }}
                    />
                  </View>
                  <Text className={styles.medDayDate}>{prettyDate(d.date)}</Text>
                  <Text className={styles.medDayWk}>{weekdayCN(d.date)}</Text>
                </View>
              );
            })}
          </View>
          <View className={styles.medStatsFooter}>
            <Text>
              ✓ 已服用 <Text style={{ color: '#10B981', fontWeight: 600 }}>{medStats7d.takenAll}</Text> 次 · × 跳过{' '}
              <Text style={{ color: '#64748B', fontWeight: 600 }}>{medStats7d.totalAll - medStats7d.takenAll}</Text> 次
            </Text>
          </View>
        </View>

        {lowInventories.length > 0 && (
          <View
            className={styles.invAlertCard}
            onClick={() => Taro.switchTab({ url: '/pages/store/index' })}
          >
            <View className={styles.invAlertHeader}>
              <View>
                <Text className={styles.invAlertTitle}>⚠️ 家庭药箱库存告急</Text>
                <Text className={styles.invAlertSub}>
                  共 {lowInventories.length} 种药品库存不足 · 点击前往补充
                </Text>
              </View>
              <Text className={styles.invAlertArrow}>→</Text>
            </View>
            <View>
              {lowInventories.slice(0, 4).map((inv) => (
                <View key={inv.id} className={styles.invAlertItem}>
                  <Text className={styles.invAlertName}>
                    💊 {inv.medicineName}（{inv.memberName}）
                  </Text>
                  <Text
                    className={classnames(
                      inv.remainingQuantity <= 0 ? styles.invAlertNone : styles.invAlertLow
                    )}
                  >
                    {inv.remainingQuantity <= 0
                      ? '已用完'
                      : `剩 ${inv.remainingQuantity}（阈值≤${inv.threshold}）`}
                  </Text>
                </View>
              ))}
              {lowInventories.length > 4 && (
                <Text className={styles.invAlertSub}>
                  还有 {lowInventories.length - 4} 种…
                </Text>
              )}
            </View>
          </View>
        )}

        <View className={styles.memberCard}>
          <View className={styles.memberHeader}>
            <Text className={styles.memberTitle}>👨‍👩‍👧 家庭成员档案</Text>
            <Button
              className={styles.addBtn}
              onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
            >
              + 添加成员
            </Button>
          </View>
          <View className={styles.memberList}>
            {familyMembers.map((member) => (
              <View
                key={member.id}
                className={classnames(
                  styles.memberItem,
                  member.id === currentMemberId && styles.active
                )}
                onClick={() => setCurrentMemberId(member.id)}
              >
                <View className={styles.memberAvatar}>
                  {member.gender === 'male' ? '👨' : '👩'}
                </View>
                <View className={styles.memberDetail}>
                  <Text className={styles.memberName}>
                    {member.name}
                    <Text style={{ fontSize: 20, color: '#94A3B8', fontWeight: 400 }}>
                      ({member.relation} · {member.age}岁)
                    </Text>
                    {member.id === currentMemberId && (
                      <StatusTag type="info" text="当前" />
                    )}
                  </Text>
                  <View className={styles.tagRow}>
                    {member.allergies?.map((a) => (
                      <View key={a} className={classnames(styles.miniTag, styles.allergy)}>
                        过敏: {a}
                      </View>
                    ))}
                    {member.chronicDiseases?.map((c) => (
                      <View key={c} className={classnames(styles.miniTag, styles.chronic)}>
                        慢病: {c}
                      </View>
                    ))}
                    {!member.allergies?.length && !member.chronicDiseases?.length && (
                      <Text className={styles.memberMeta}>健康状况良好</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.cardTitle}>📋 个人核验记录</Text>
          <View className={styles.filterBar}>
            {filterOptions.map((opt) => (
              <Button
                key={opt.key}
                className={classnames(
                  styles.filterChip,
                  activeFilter === opt.key && styles.active
                )}
                onClick={() => setActiveFilter(opt.key)}
              >
                {opt.label}
              </Button>
            ))}
          </View>
          {filteredRecords.length === 0 ? (
            <EmptyState icon="📭" title="暂无核验记录" />
          ) : (
            <View>
              {filteredRecords.map((record) => {
                const auth = getAuthenticityLabel(record.authenticity);
                return (
                  <View
                    key={record.id}
                    className={styles.recordItem}
                    onClick={() => handleRecordClick(record.medicineId)}
                  >
                    <View className={styles.recordIcon}>
                      {record.queryType === 'scan' ? '📷' : '⌨️'}
                    </View>
                    <View className={styles.recordContent}>
                      <Text className={styles.recordName}>{record.medicineName}</Text>
                      <View className={styles.recordInfo}>
                        <StatusTag
                          type={auth.color === 'success' ? 'success' : auth.color === 'warning' ? 'warning' : 'info'}
                          text={auth.label}
                        />
                        {record.memberName && <Text>👤 {record.memberName}</Text>}
                        <Text>📦 {record.batchNumber}</Text>
                      </View>
                      <View className={styles.recordInfo}>
                        <Text>{record.queryTime}</Text>
                        <Text>{record.queryType === 'scan' ? '扫码核验' : '手动输入'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View className={styles.sectionCard}>
          <Text className={styles.cardTitle}>⚙️ 更多功能</Text>
          <View className={styles.menuList}>
            <View className={styles.menuItem} onClick={handleExport}>
              <View className={classnames(styles.menuIcon, styles.green)}>📤</View>
              <View className={styles.menuContent}>
                <Text className={styles.menuLabel}>导出购药清单</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            </View>
            <View className={styles.menuItem} onClick={handleShare}>
              <View className={classnames(styles.menuIcon, styles.blue)}>🔗</View>
              <View className={styles.menuContent}>
                <Text className={styles.menuLabel}>分享核验结果</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            </View>
            <View
              className={styles.menuItem}
              onClick={() => Taro.switchTab({ url: '/pages/medicine/index' })}
            >
              <View className={classnames(styles.menuIcon, styles.purple)}>⏰</View>
              <View className={styles.menuContent}>
                <Text className={styles.menuLabel}>服药提醒管理</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            </View>
            <View
              className={styles.menuItem}
              onClick={() => Taro.switchTab({ url: '/pages/store/index' })}
            >
              <View className={classnames(styles.menuIcon, styles.orange)}>🏥</View>
              <View className={styles.menuContent}>
                <Text className={styles.menuLabel}>购药记录与票据</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            </View>
            <View
              className={styles.menuItem}
              onClick={() => Taro.showToast({ title: '暂无版本更新', icon: 'none' })}
            >
              <View className={classnames(styles.menuIcon, styles.red)}>ℹ️</View>
              <View className={styles.menuContent}>
                <Text className={styles.menuLabel}>关于我们 v1.0.0</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfilePage;
