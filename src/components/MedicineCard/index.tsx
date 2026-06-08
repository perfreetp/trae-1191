import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { Medicine } from '@/types';
import StatusTag from '@/components/StatusTag';
import { getExpiryStatus } from '@/utils';
import styles from './index.module.scss';

interface MedicineCardProps {
  medicine: Medicine;
  isFavorite?: boolean;
  showFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onViewDetail?: (id: string) => void;
}

const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  isFavorite = false,
  showFavorite = true,
  onToggleFavorite,
  onViewDetail,
}) => {
  const expiry = getExpiryStatus(medicine.expiryDate);

  const handleCardClick = () => {
    if (onViewDetail) {
      onViewDetail(medicine.id);
    } else {
      Taro.navigateTo({ url: `/pages/detail/index?id=${medicine.id}` });
    }
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    onToggleFavorite?.(medicine.id);
  };

  return (
    <View className={styles.card} onClick={handleCardClick}>
      <View className={styles.header}>
        <Image
          className={styles.image}
          src={medicine.image}
          mode="aspectFill"
        />
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{medicine.name}</Text>
            <StatusTag
              type={medicine.authenticity === 'authentic' ? 'success' : 'warning'}
              text={medicine.authenticity === 'authentic' ? '正品' : '异常'}
            />
          </View>
          <Text className={styles.genericName}>{medicine.genericName}</Text>
          <View className={styles.metaRow}>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>规格:</Text>
              <Text>{medicine.specification}</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>类别:</Text>
              <Text>{medicine.category}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.metaRow} style={{ marginBottom: '0' }}>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>批准文号:</Text>
          <Text style={{ color: '$color-text-primary' }}>{medicine.approvalNumber}</Text>
        </View>
      </View>

      <View className={styles.divider} />

      <View className={styles.footer}>
        <View className={styles.footerLeft}>
          <Text className={styles.batch}>
            批号: {medicine.batchNumber}
          </Text>
          <StatusTag type={expiry.color} text={expiry.label} />
        </View>
        <View className={styles.footerRight}>
          {showFavorite && (
            <Button
              className={classnames(styles.favBtn, isFavorite && styles.favorited)}
              onClick={handleFavorite}
            >
              {isFavorite ? '❤️' : '🤍'}
            </Button>
          )}
          <Button
            className={styles.detailBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            查看详情
          </Button>
        </View>
      </View>
    </View>
  );
};

export default MedicineCard;
