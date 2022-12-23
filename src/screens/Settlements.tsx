import { useEffect } from 'react';
import { withLayout } from '../components/layout/withLayout';

import Center from '../components/utils/Center';

interface Props {}

const Settlements = ({}: Props) => {
  useEffect(() => {}, []);

  return withLayout(<Center>Settlements</Center>);
};

export default Settlements;
