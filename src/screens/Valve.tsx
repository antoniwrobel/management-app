import { useEffect } from 'react';
import { withLayout } from '../components/layout/withLayout';

import Center from '../components/utils/Center';

interface Props {}

const Valve = ({}: Props) => {
  useEffect(() => {}, []);

  return withLayout(<Center>Valve</Center>);
};

export default Valve;