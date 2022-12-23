import { useEffect } from 'react';
import { withLayout } from '../components/layout/withLayout';

import Center from '../components/utils/Center';

interface Props {}

const Inventory = ({}: Props) => {
  useEffect(() => {}, []);

  return withLayout(<Center>Inventory</Center>);
};

export default Inventory;
