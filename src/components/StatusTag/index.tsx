import React from 'react';
import { View } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatusTagProps {
  type: 'success' | 'warning' | 'error' | 'info' | 'expired' | 'near' | 'normal';
  text: string;
}

const StatusTag: React.FC<StatusTagProps> = ({ type, text }) => {
  return <View className={classnames(styles.tag, styles[type])}>{text}</View>;
};

export default StatusTag;
