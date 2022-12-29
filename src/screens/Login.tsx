import { Box, Tab, Tabs } from '@mui/material';
import React from 'react';
import AuthContainer from '../components/auth/AuthContainer';
import Center from '../components/utils/Center';

interface Props {}

const Login = ({}: Props) => {
  return (
    <Center height={90}>
      <Box display={'flex'} alignItems={'center'} flexDirection={'column'} boxShadow={2} margin={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Tabs value={0} variant="fullWidth">
            <Tab sx={{ px: { lg: 20, xs: 6 } }} label="Login" />
          </Tabs>
        </Box>
        {/* login */}
        <TabPanel value={0} index={0}>
          <AuthContainer />
        </TabPanel>
      </Box>
    </Center>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          <>{children}</>
        </Box>
      )}
    </div>
  );
};

export default Login;
