import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { CirculationNode } from '@/types';
import { getCirculationTypeLabel } from '@/utils';
import styles from './index.module.scss';

interface TimelineNodeProps {
  node: CirculationNode;
  isLast?: boolean;
}

const TimelineNode: React.FC<TimelineNodeProps> = ({ node, isLast }) => {
  return (
    <View className={classnames(styles.node, isLast && 'last')}>
      <View className={styles.indicator}>
        <View className={classnames(styles.dot, styles[node.type])} />
        {!isLast && <View className={styles.line} />}
      </View>
      <View className={styles.content}>
        <View className={styles.header}>
          <View className={classnames(styles.typeTag, styles[node.type])}>
            {getCirculationTypeLabel(node.type)}
          </View>
          <Text className={styles.time}>{node.time}</Text>
        </View>
        <Text className={styles.name}>{node.name}</Text>
        <Text className={styles.operation}>
          📋 {node.operation}
          {node.quantity ? ` · 数量: ${node.quantity}` : ''}
        </Text>
        <View className={styles.details}>
          <View className={styles.detailItem}>
            <Text className={styles.label}>地址:</Text>
            <Text className={styles.value}>{node.address}</Text>
          </View>
          {node.licenseNumber !== '-' && (
            <View className={styles.detailItem}>
              <Text className={styles.label}>许可证:</Text>
              <Text className={styles.value}>{node.licenseNumber}</Text>
            </View>
          )}
          <View className={styles.detailItem}>
            <Text className={styles.label}>操作人:</Text>
            <Text className={styles.value}>{node.operator}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TimelineNode;
