import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  title: string;
  desc?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📦', title, desc }) => {
  return (
    <View className={styles.container}>
      <View className={styles.icon}>{icon}</View>
      <Text className={styles.title}>{title}</Text>
      {desc && <Text className={styles.desc}>{desc}</Text>}
    </View>
  );
};

export default EmptyState;
