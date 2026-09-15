import { useState } from 'react';
import { Container, VStack, Heading, Text, Input, Button, Alert, AlertIcon, HStack } from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const run = async (mode) => {
    setStatus(null);
    setBusy(true);
    try {
      const { error } = mode === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/settings` } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) setStatus({ type: 'error', text: error.message });
      else navigate('/settings');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="lg">Owner sign in</Heading>
        <Text color="gray.600">The first account created becomes the owner and can manage news keys and read messages.</Text>
        {status && <Alert status={status.type}><AlertIcon />{status.text}</Alert>}
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <HStack>
          <Button colorScheme="teal" onClick={() => run('signin')} isLoading={busy}>Sign in</Button>
          <Button variant="outline" onClick={() => run('signup')} isLoading={busy}>Create account</Button>
        </HStack>
      </VStack>
    </Container>
  );
};

export default Auth;
