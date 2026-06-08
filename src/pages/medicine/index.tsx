import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  Input,
  Switch,
  Picker,
  Image,
} from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore, mockMedicines } from '@/store/useAppStore';
import MedicineCard from '@/components/MedicineCard';
import EmptyState from '@/components/EmptyState';
import { formatDate, generateId } from '@/utils';
import type { Medicine, MedicineReminder } from '@/types';
import styles from './index.module.scss';

type TabType = 'reminders' | 'favorites' | 'recalls';
type AddStep = 0 | 1 | 2 | 3 | 4;
type SourceType = 'favorites' | 'recent' | 'manual';

interface ReminderDraft {
  source: SourceType;
  medicineId: string;
  medicineName: string;
  memberId: string;
  memberName: string;
  dosage: string;
  frequency: string;
  freqNum: number;
  times: string[];
  startDate: string;
  endDate: string;
  notes: string;
  enabled: boolean;
}

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '18:00', '22:00'],
};

const todayISO = () => new Date().toISOString().split('T')[0];
const addDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const MedicinePage: React.FC = () => {
  const activeMedicineTab = useAppStore((s) => s.activeMedicineTab);
  const setActiveMedicineTab = useAppStore((s) => s.setActiveMedicineTab);
  const [activeTab, setActiveTab] = useState<TabType>(activeMedicineTab || 'reminders');

  const familyMembers = useAppStore((s) => s.familyMembers);
  const currentMemberId = useAppStore((s) => s.currentMemberId);
  const setCurrentMemberId = useAppStore((s) => s.setCurrentMemberId);
  const reminders = useAppStore((s) => s.reminders);
  const toggleReminder = useAppStore((s) => s.toggleReminder);
  const addReminder = useAppStore((s) => s.addReminder);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const queryRecords = useAppStore((s) => s.queryRecords);

  useEffect(() => {
    if (activeMedicineTab && activeMedicineTab !== activeTab) {
      setActiveTab(activeMedicineTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memberReminders = useMemo(
    () => reminders.filter((r) => r.memberId === currentMemberId),
    [reminders, currentMemberId]
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

  const recallMedicines = useMemo(
    () => mockMedicines.filter((m) => m.recallNotice),
    []
  );

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<AddStep>(0);
  const [draft, setDraft] = useState<ReminderDraft>({
    source: 'favorites',
    medicineId: '',
    medicineName: '',
    memberId: currentMemberId,
    memberName: familyMembers.find((m) => m.id === currentMemberId)?.name || '',
    dosage: '',
    frequency: '每日1次',
    freqNum: 1,
    times: [...DEFAULT_TIMES[1]],
    startDate: todayISO(),
    endDate: addDaysISO(6),
    notes: '',
    enabled: true,
  });

  const resetDraft = () => {
    const def = familyMembers.find((m) => m.id === currentMemberId);
    setDraft({
      source: 'favorites',
      medicineId: '',
      medicineName: '',
      memberId: currentMemberId,
      memberName: def?.name || '',
      dosage: '',
      frequency: '每日1次',
      freqNum: 1,
      times: [...DEFAULT_TIMES[1]],
      startDate: todayISO(),
      endDate: addDaysISO(6),
      notes: '',
      enabled: true,
    });
    setStep(0);
  };

  const openAdd = () => {
    resetDraft();
    setShowModal(true);
  };

  const closeAdd = () => {
    setShowModal(false);
    setTimeout(() => resetDraft(), 200);
  };

  const selectSource = (source: SourceType) => {
    setDraft((d) => ({ ...d, source, medicineId: '', medicineName: '', dosage: '' }));
    setStep(1);
  };

  const selectMedicine = (med: Medicine) => {
    setDraft((d) => ({
      ...d,
      medicineId: med.id,
      medicineName: med.name,
      dosage: med.dosage,
    }));
    setStep(2);
  };

  const submitManual = () => {
    if (!draft.medicineName.trim()) {
      Taro.showToast({ title: '请输入药品名称', icon: 'none' });
      return;
    }
    setStep(2);
  };

  const selectMember = (id: string) => {
    const mem = familyMembers.find((m) => m.id === id);
    setDraft((d) => ({
      ...d,
      memberId: id,
      memberName: mem?.name || '',
    }));
    setStep(3);
  };

  const setFreq = (num: number) => {
    setDraft((d) => ({
      ...d,
      freqNum: num,
      frequency: `每日${num}次`,
      times:
        num === d.times.length ? d.times : DEFAULT_TIMES[num]
          ? [...DEFAULT_TIMES[num]]
          : d.times.slice(0, num),
    }));
  };

  const setTimeAt = (idx: number, value: string) => {
    setDraft((d) => {
      const next = [...d.times];
      next[idx] = value;
      return { ...d, times: next };
    });
  };

  const saveReminder = () => {
    if (!draft.medicineName.trim()) {
      Taro.showToast({ title: '请选择或输入药品', icon: 'none' });
      return;
    }
    if (!draft.memberId) {
      Taro.showToast({ title: '请选择家庭成员', icon: 'none' });
      return;
    }
    if (!draft.dosage.trim()) {
      Taro.showToast({ title: '请填写服用剂量', icon: 'none' });
      return;
    }
    if (draft.times.some((t) => !t)) {
      Taro.showToast({ title: '请填写完整服药时间', icon: 'none' });
      return;
    }
    const reminder: MedicineReminder = {
      id: generateId(),
      medicineId: draft.medicineId || 'custom_' + Date.now(),
      medicineName: draft.medicineName,
      memberId: draft.memberId,
      memberName: draft.memberName,
      dosage: draft.dosage,
      frequency: draft.frequency,
      times: draft.times,
      startDate: draft.startDate,
      endDate: draft.endDate,
      enabled: draft.enabled,
      notes: draft.notes,
    };
    addReminder(reminder);
    setActiveMedicineTab('reminders');
    Taro.showToast({ title: '服药提醒已添加', icon: 'success' });
    closeAdd();
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
      <Button className={styles.addBtn} onClick={openAdd}>
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

  const renderStep0 = () => (
    <View className={styles.stepBody}>
      <Text className={styles.stepTitle}>请选择药品来源</Text>
      <View className={styles.sourceList}>
        <View
          className={classnames(styles.sourceCard, favoriteMedicines.length === 0 && styles.disabled)}
          onClick={() => favoriteMedicines.length && selectSource('favorites')}
        >
          <Text className={styles.sourceIcon}>❤️</Text>
          <Text className={styles.sourceName}>从常用药选择</Text>
          <Text className={styles.sourceDesc}>{favoriteMedicines.length}种已收藏药品</Text>
        </View>
        <View
          className={classnames(styles.sourceCard, recentMedicines.length === 0 && styles.disabled)}
          onClick={() => recentMedicines.length && selectSource('recent')}
        >
          <Text className={styles.sourceIcon}>📋</Text>
          <Text className={styles.sourceName}>最近核验记录</Text>
          <Text className={styles.sourceDesc}>{recentMedicines.length}种近期查询</Text>
        </View>
        <View className={styles.sourceCard} onClick={() => selectSource('manual')}>
          <Text className={styles.sourceIcon}>⌨️</Text>
          <Text className={styles.sourceName}>手动输入药品</Text>
          <Text className={styles.sourceDesc}>手动输入药品名称与规格</Text>
        </View>
      </View>
    </View>
  );

  const renderStep1 = () => {
    if (draft.source === 'manual') {
      return (
        <View className={styles.stepBody}>
          <Text className={styles.stepTitle}>输入药品信息</Text>
          <View className={styles.field}>
            <Text className={styles.fieldLabel}>药品名称 *</Text>
            <Input
              className={styles.fieldInput}
              value={draft.medicineName}
              onInput={(e) => setDraft((d) => ({ ...d, medicineName: e.detail.value }))}
              placeholder="例：头孢克肟胶囊"
            />
          </View>
          <View className={styles.field}>
            <Text className={styles.fieldLabel}>规格（可选）</Text>
            <Input
              className={styles.fieldInput}
              value={draft.dosage}
              onInput={(e) => setDraft((d) => ({ ...d, dosage: e.detail.value }))}
              placeholder="例：0.1g*12粒/盒"
            />
          </View>
          <Button className={styles.primaryBtn} onClick={submitManual}>
            下一步 →
          </Button>
        </View>
      );
    }
    const list = draft.source === 'favorites' ? favoriteMedicines : recentMedicines;
    return (
      <View className={styles.stepBody}>
        <Text className={styles.stepTitle}>
          {draft.source === 'favorites' ? '选择常用药' : '从最近记录选择'}
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
              <Image className={styles.medPickerImg} src={m.image} mode="aspectFill" />
              <View className={styles.medPickerInfo}>
                <Text className={styles.medPickerName}>{m.name}</Text>
                <Text className={styles.medPickerSpec}>{m.specification}</Text>
                <Text className={styles.medPickerDosage}>推荐: {m.dosage}</Text>
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

  const renderStep2 = () => (
    <View className={styles.stepBody}>
      <Text className={styles.stepTitle}>选择服药成员</Text>
      <Text className={styles.stepTip}>当前选择: 「{draft.medicineName}」</Text>
      <View className={styles.memberList}>
        {familyMembers.map((m) => (
          <View
            key={m.id}
            className={classnames(
              styles.memberCard,
              draft.memberId === m.id && styles.memberActive
            )}
            onClick={() => selectMember(m.id)}
          >
            <View className={styles.memberAv}>
              {m.gender === 'male' ? '👨' : '👩'}
            </View>
            <Text className={styles.memberCardName}>{m.name}</Text>
            <Text className={styles.memberCardRel}>{m.relation}</Text>
            {draft.memberId === m.id && <Text className={styles.memberCheck}>✓</Text>}
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className={styles.stepBody}>
      <Text className={styles.stepTitle}>设置服药详情</Text>
      <Text className={styles.stepTip}>
        {draft.memberName} · {draft.medicineName}
      </Text>
      <View className={styles.field}>
        <Text className={styles.fieldLabel}>服用剂量 *</Text>
        <Input
          className={styles.fieldInput}
          value={draft.dosage}
          onInput={(e) => setDraft((d) => ({ ...d, dosage: e.detail.value }))}
          placeholder="例：0.25g(1粒)"
        />
      </View>
      <View className={styles.field}>
        <Text className={styles.fieldLabel}>每日频次</Text>
        <View className={styles.segRow}>
          {[1, 2, 3, 4].map((n) => (
            <View
              key={n}
              className={classnames(styles.segItem, draft.freqNum === n && styles.segActive)}
              onClick={() => setFreq(n)}
            >
              每日{n}次
            </View>
          ))}
        </View>
      </View>
      <View className={styles.field}>
        <Text className={styles.fieldLabel}>服药时间 *</Text>
        <View className={styles.timeList}>
          {draft.times.map((t, idx) => (
            <View key={idx} className={styles.timeRow}>
              <Text className={styles.timeIndex}>第{idx + 1}次</Text>
              <Picker
                mode="time"
                value={t}
                onChange={(e) => setTimeAt(idx, e.detail.value)}
              >
                <View className={styles.timePicker}>{t || '请选择时间'}</View>
              </Picker>
            </View>
          ))}
        </View>
      </View>
      <View className={styles.field}>
        <Text className={styles.fieldLabel}>起止日期</Text>
        <View className={styles.dateRow}>
          <Picker
            mode="date"
            value={draft.startDate}
            onChange={(e) => setDraft((d) => ({ ...d, startDate: e.detail.value }))}
          >
            <View className={styles.datePicker}>起: {formatDate(draft.startDate)}</View>
          </Picker>
          <Text className={styles.dateSep}>至</Text>
          <Picker
            mode="date"
            value={draft.endDate}
            start={draft.startDate}
            onChange={(e) => setDraft((d) => ({ ...d, endDate: e.detail.value }))}
          >
            <View className={styles.datePicker}>止: {formatDate(draft.endDate)}</View>
          </Picker>
        </View>
      </View>
      <View className={styles.field}>
        <Text className={styles.fieldLabel}>备注说明</Text>
        <Input
          className={styles.fieldInput}
          value={draft.notes}
          onInput={(e) => setDraft((d) => ({ ...d, notes: e.detail.value }))}
          placeholder="例：饭后服用 / 与餐同服"
        />
      </View>
      <View className={styles.field}>
        <View className={styles.fieldRow}>
          <Text className={styles.fieldLabel}>保存后立即开启</Text>
          <Switch
            checked={draft.enabled}
            onChange={(e) => setDraft((d) => ({ ...d, enabled: e.detail.value }))}
            color="#0EA5E9"
          />
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View className={styles.stepBody}>
      <Text className={styles.stepTitle}>确认提醒信息</Text>
      <View className={styles.summaryCard}>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>💊 药品</Text>
          <Text className={styles.summaryValue}>{draft.medicineName}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>👤 成员</Text>
          <Text className={styles.summaryValue}>{draft.memberName}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>💉 剂量</Text>
          <Text className={styles.summaryValue}>{draft.dosage}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>📅 频次</Text>
          <Text className={styles.summaryValue}>
            {draft.frequency}（{draft.times.join(' / ')}）
          </Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>⏳ 周期</Text>
          <Text className={styles.summaryValue}>
            {formatDate(draft.startDate)} ~ {formatDate(draft.endDate)}
          </Text>
        </View>
        {draft.notes && (
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>📝 备注</Text>
            <Text className={styles.summaryValue}>{draft.notes}</Text>
          </View>
        )}
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>🔔 状态</Text>
          <Text
            className={classnames(
              styles.summaryValue,
              draft.enabled ? styles.success : styles.muted
            )}
          >
            {draft.enabled ? '保存后立即生效' : '保存为草稿'}
          </Text>
        </View>
      </View>
      <Button className={styles.primaryBtn} onClick={saveReminder}>
        ✅ 确认保存
      </Button>
    </View>
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
            onClick={() => {
              setActiveTab('reminders');
              setActiveMedicineTab('reminders');
            }}
          >
            服药提醒 ({memberReminders.length})
          </Button>
          <Button
            className={classnames(styles.tabItem, activeTab === 'favorites' && styles.active)}
            onClick={() => {
              setActiveTab('favorites');
              setActiveMedicineTab('favorites');
            }}
          >
            常用药 ({favoriteMedicines.length})
          </Button>
          <Button
            className={classnames(styles.tabItem, activeTab === 'recalls' && styles.active)}
            onClick={() => {
              setActiveTab('recalls');
              setActiveMedicineTab('recalls');
            }}
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

      {showModal && (
        <View className={styles.modalMask} onClick={closeAdd}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalClose} onClick={closeAdd}>
                ✕
              </Text>
              <Text className={styles.modalTitle}>
                {step === 0 && '添加服药提醒'}
                {step === 1 && '1/4 · 选择药品'}
                {step === 2 && '2/4 · 选择成员'}
                {step === 3 && '3/4 · 设置详情'}
                {step === 4 && '4/4 · 确认信息'}
              </Text>
              {step > 0 && step < 4 && (
                <Text
                  className={styles.modalBack}
                  onClick={() => setStep((s) => (s - 1) as AddStep)}
                >
                  ← 返回
                </Text>
              )}
              {step === 4 && <View style={{ width: 60 }} />}
            </View>
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 3 && (
              <View className={styles.modalFooter}>
                <Button className={styles.primaryBtn} onClick={() => setStep(4)}>
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

export default MedicinePage;
