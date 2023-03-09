import { Box, Button } from '@mui/material';
import withLayout from '../components/layout/withLayout';

const AllegroDetails = () => {
  // const access_token = window.localStorage.getItem('access_token');
  // const refresh_token = window.localStorage.getItem('refresh_token');

  const fetchData = async () => {
    // console.log({ access_token, refresh_token });
    // try {
    //   const response = await axios.get(`https://api.allegro.pl/sale/offers`, {
    //     headers: {
    //       Authorization: `Bearer ${access_token}`,
    //       Accept: 'application/vnd.allegro.public.v1+json'
    //     }
    //   });
    //   console.log({ response });
    // } catch (error) {
    //   console.error(error);
    // }
  };

  return (
    <Box>
      <Button onClick={fetchData}>Pobierz dane</Button>
    </Box>
  );
};

export default withLayout(AllegroDetails);
