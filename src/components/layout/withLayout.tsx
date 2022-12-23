import Navigation from '../navigation/Navigation';

export const withLayout = (children: React.ReactElement) => (
  <>
    <Navigation />
    {children}
  </>
);
