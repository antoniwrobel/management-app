import Navigation from '../navigation/Navigation';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};
