import withLayout from '../components/layout/withLayout';
import MagazynKomis from './MagazynKomis';

import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';

const Magazyn = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const isMobile = window.innerWidth < 900

  return (
    <Box display={'flex'} alignItems={'center'} flexDirection={'column'} boxShadow={2} margin={3} overflow={isMobile ? "scroll" : "initial"}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Komis" />
          <Tab label="Priv" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <MagazynKomis />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Box sx={{ p: '20px' }}>PRIV </Box>
      </TabPanel>
    </Box>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
      {value === index && (
        <Box>
          <>{children}</>
        </Box>
      )}
    </div>
  );
};

export default withLayout(Magazyn);
