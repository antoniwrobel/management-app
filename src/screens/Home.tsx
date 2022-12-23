import { useEffect } from 'react';
import { withLayout } from '../components/layout/withLayout';

import Center from '../components/utils/Center';

interface Props {}

const Home = ({}: Props) => {
  useEffect(() => {}, []);

  return withLayout(<Center>Home</Center>);
};

export default Home;
