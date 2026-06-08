import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore, mockMedicines } from '@/store/useAppStore';
import MedicineCard from '@/components/MedicineCard';
import EmptyState from '@/components/EmptyState';
import { formatDate } from '@/utils';
import styles from './index.module.scss';

type TabType = 'reminders' | 'favorites' | 'recalls';

const MedicinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('reminders');

  const familyMembers = useAppStore((s) => s.familyMembers);
  const currentMemberId = useAppStore((s) => s.currentMemberId);
  const setCurrentMemberId = useAppStore((s) => s.setCurrentMemberId);
  const reminders = useAppStore((s) => s.reminders);
  const toggleReminder = useAppStore((s) => s.toggleReminder);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const memberReminders = useMemo(
    () => reminders.filter((r) => r.memberId === currentMemberId),
    [reminders, currentMemberId]
  );

  const favoriteMedicines = useMemo(
    () => mockMedicines.filter((m) => favorites.includes(m.id)),
    [favorites]
  );

  const recallMedicines = useMemo(
    () => mockMedicines.filter((m) => m.recallNotice),
    []
  );

  const handleAddReminder = () => {
    Taro.showActionSheet({
      itemList: ['从常用药选择', '扫码添加药品', '手动输入药品'],
      success: (res) => {
        if (res.tapIndex === 1) {
          Taro.switchTab({ url: '/pages/scan/index' });
        } else {
          Taro.showToast({ title: '功能开发中', icon: 'none' });
        }
      },
    });
  };

  const renderReminders = () => (
    <>
      {memberReminders.length === 0 ? (
        <EmptyState
          icon="⏰"
          title="暂无服药提醒"
          desc="添加常用药品并设置服药提醒，不错过每次用药"
        />
      ) : (
        memberReminders.map((reminder) => (
          <View key={reminder.id} className={styles.reminderCard}>
            <View className={styles.reminderIcon}>💊</View>
            <View className={styles.reminderContent}>
              <View className={styles.reminderHeader}>
                <Text className={styles.reminderName}>{reminder.medicineName}</Text>
                <View
                  className={classnames(styles.switch, reminder.enabled && styles.on)}
                  onClick={() => toggleReminder(reminder.id)}
                >
                  <View className={styles.switchDot} />
                </View>
              </View>
              <View className={styles.reminderMeta}>
                <View className={styles.metaBadge}>{reminder.memberName}</View>
                <Text>剂量: {reminder.dosage}</Text>
                <Text>{reminder.frequency}</Text>
              </View>
              <View className={styles.reminderTimes}>
                {reminder.times.map((time) => (
                  <View key={time} className={styles.timeChip}>
                    ⏰ {time}
                  </View>
                ))}
              </View>
              <View className={styles.reminderFooter}>
                <Text className={styles.reminderDate}>
                  {formatDate(reminder.startDate)} ~ {formatDate(reminder.endDate)}
                </Text>
                {reminder.notes && (
                  <Text className={styles.reminderNote}>📝 {reminder.notes}</Text>
                )}
              </View>
            </View>
          </View>
        ))
      )}
      <Button className={styles.addBtn} onClick={handleAddReminder}>
        + 添加服药提醒
      </Button>
    </>
  );

  const renderFavorites = () => (
    <>
      {favoriteMedicines.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="暂无收藏药品"
          desc="在药品详情页点击收藏按钮，将家庭常用药加入收藏"
        />
      ) : (
        favoriteMedicines.map((med) => (
          <MedicineCard
            key={med.id}
            medicine={med}
            isFavorite={true}
            showFavorite={true}
            onToggleFavorite={toggleFavorite}
          />
        ))
      )}
    </>
  );

  const renderRecalls = () => (
    <>
      {recallMedicines.length === 0 ? (
        <EmptyState
          icon="✅"
          title="暂无召回通知"
          desc="您收藏和查询过的药品均无召回通知"
        />
      ) : (
        recallMedicines.map((med) => (
          <View key={med.id}>
            <View
              className={styles.recallCard}
              onClick={() =>
                Taro.navigateTo({ url: `/pages/detail/index?id=${med.id}` })
              }
            >
              <View className={styles.recallHeader}>
                <View
                  className={classnames(
                    styles.recallLevel,
                    med.recallNotice?.level === 'medium' && styles.medium,
                    med.recallNotice?.level === 'low' && styles.low
                  )}
                >
                  {med.recallNotice?.level === 'high'
                    ? '🔴 一级召回'
                    : med.recallNotice?.level === 'medium'
                    ? '🟠 二级召回'
                    : '🔵 三级召回'}
                </View>
                <Text className={styles.recallDate}>
                  发布: {formatDate(med.recallNotice?.publishDate || '')}
                </Text>
              </View>
              <Text className={styles.recallTitle}>{med.recallNotice?.title}</Text>
              <Text className={styles.recallContent}>{med.recallNotice?.content}</Text>
              <Text className={styles.recallScope}>
                召回范围: {med.recallNotice?.scope} · 涉及药品: {med.name}({med.batchNumber})
              </Text>
            </View>
            <MedicineCard medicine={med} isFavorite={true} showFavorite={false} />
          </View>
        ))
      )}
    </>
  );

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.memberBar}>
        <Text className={styles.memberLabel}>👨‍👩‍👧 当前查看成员</Text>
        <ScrollView scrollX className={styles.memberList} enhanced showScrollbar={false}>
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
              <Text className={styles.memberName}>{member.name}</Text>
              <Text className={styles.memberRelation}>{member.relation}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.content}>
        <View className={styles.tabBar}>
          <Button
            className={classnames(styles.tabItem, activeTab === 'reminders' && styles.active)}
            onClick={() => setActiveTab('reminders')}
          >
            服药提醒 ({memberReminders.length})
          </Button>
          <Button
            className={classnames(styles.tabItem, activeTab === 'favorites' && styles.active)}
            onClick={() => setActiveTab('favorites')}
          >
            常用药 ({favoriteMedicines.length})
          </Button>
          <Button
            className={classnames(styles.tabItem, activeTab === 'recalls' && styles.active)}
            onClick={() => setActiveTab('recalls')}
          >
            召回通知 ({recallMedicines.length})
          </Button>
        </View>

        <View className={styles.section}>
          {activeTab === 'reminders' && renderReminders()}
          {activeTab === 'favorites' && renderFavorites()}
          {activeTab === 'recalls' && renderRecalls()}
        </View>
      </View>
    </ScrollView>
  );
};

export default MedicinePage;
