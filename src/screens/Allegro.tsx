import { Box, Container } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../components/auth/auth-service";
import { redirect_uri } from "./AllegroProtected";
import { useLocalStorage } from "./helpers";

export const Allegro = () => {
    const [code, setCode] = useState<null | string>()
    const isMobile = window.innerWidth < 900

    const [, setAccessToken] = useLocalStorage(ACCESS_TOKEN_KEY, null)
    const [, setRefreshToken] = useLocalStorage(REFRESH_TOKEN_KEY, null)
    const [success, setSuccess] = useState(false)

    const handleUserAuth = async () => {
        try {
            const url = `https://allegro.pl/auth/oauth/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect_uri}`
            const client_id = process.env.CLIENT_ID
            const client_secret = process.env.CLIENT_SECRET
            const encodedString = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

            const response = await axios.post(url, {
                Headers: {
                    Authorization: `Basic ${encodedString}`

                }
            })

            if (response.status === 200) {
                setAccessToken(response.data.access_token)
                setRefreshToken(response.data.refresh_token)
                setSuccess(true)
            }
        } catch (error) {
            console.error(error)
        }

    }

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        if (code) {
            setCode(code)
        }
    }, [])

    useEffect(() => {
        if (code) {
            handleUserAuth()
        }

    }, [code])

    return (
        <Box display={'flex'} alignItems={'center'} flexDirection={'column'} boxShadow={2} margin={3} overflow={isMobile ? "scroll" : "initial"}>
            <Container sx={{ p: '0px !important', m: '24px', maxWidth: '100% !important', width: 'auto' }}>
                Allegro redirection page

                {success ? "Poprawnie zapisano tokeny" : "Brak tokenów"}
            </Container>
        </Box>
    );


}
