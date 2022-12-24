import { useEffect } from 'react';
import withLayout from '../components/layout/withLayout';

import Center from '../components/utils/Center';

interface Props {}

const Spendings = ({}: Props) => {
  useEffect(() => {}, []);

  return <Center>Spendings</Center>;
};

export default withLayout(Spendings);
