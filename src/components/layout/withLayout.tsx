import Navigation from '../navigation/Navigation';

const withLayout = (Component: any) => (
  <>
    <Navigation />
    <Component />
  </>
);

export default withLayout;
