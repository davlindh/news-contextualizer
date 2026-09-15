import { useEffect, useState } from 'react';
import { Container, VStack, Heading, Text, Input, Button, Alert, AlertIcon, Badge, HStack, Box, Link as CLink, Divider } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

const PROVIDERS = [
  { id: 'gnews', label: 'GNews', help: 'Free key from gnews.io' },
  { id: 'newsapi', label: 'NewsAPI', help: 'Free key from newsapi.org (works in preview only)' },
];

const Settings = () => {
  const [session, setSession] = useState(null);
  const [saved, setSaved] = useState({});
  const [values, setValues] = useState({ gnews: '', newsapi: '' });
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState('');
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadStatus = async () => {
    const { data } = await supabase.functions.invoke('save-api-key', { method: 'GET' });
    if (data) setSaved(data);
  };

  useEffect(() => { loadStatus(); }, []);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('contact_messages')
      .select('id,name,email,message,created_at')
      .order('created_at', { ascending: false })
      .limit(25)
      .then(({ data }) => setMessages(data || []));
  }, [session]);

  const saveKey = async (provider) => {
    setStatus(null);
    setBusy(provider);
    try {
      const { data, error } = await supabase.functions.invoke('save-api-key', {
        body: { provider, apiKey: values[provider] },
      });
      if (error) {
        const details = error.context ? await error.context.text() : error.message;
        let msg = 'Could not save the key.';
        try { msg = JSON.parse(details).error || msg; } catch { /* keep default */ }
        setStatus({ type: 'error', text: msg });
      } else if (data?.ok) {
        setStatus({ type: 'success', text: `${provider} key saved. The feed can use it now.` });
        setValues({ ...values, [provider]: '' });
        loadStatus();
      }
    } finally {
      setBusy('');
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="lg">News settings</Heading>
        {!session && (
          <Alert status="info">
            <AlertIcon />
            Sign in as the owner to save keys.
            <Button ml={3} size="sm" onClick={() => navigate('/auth')}>Sign in</Button>
          </Alert>
        )}
        {status && <Alert status={status.type}><AlertIcon />{status.text}</Alert>}

        {PROVIDERS.map((p) => (
          <Box key={p.id} borderWidth="1px" borderRadius="lg" p={4}>
            <HStack mb={2}>
              <Heading size="sm">{p.label}</Heading>
              <Badge colorScheme={saved[p.id] ? 'green' : 'gray'}>{saved[p.id] ? 'Key saved' : 'No key'}</Badge>
            </HStack>
            <Text fontSize="sm" color="gray.600" mb={2}>{p.help}</Text>
            <HStack>
              <Input
                type="password"
                placeholder={`Paste your ${p.label} key`}
                value={values[p.id]}
                onChange={(e) => setValues({ ...values, [p.id]: e.target.value })}
                isDisabled={!session}
              />
              <Button onClick={() => saveKey(p.id)} isLoading={busy === p.id} isDisabled={!session || !values[p.id]}>Save</Button>
            </HStack>
          </Box>
        ))}

        {session && (
          <Box>
            <Divider my={4} />
            <Heading size="md" mb={3}>Messages received</Heading>
            {messages.length === 0 && <Text color="gray.600">No messages yet.</Text>}
            <VStack align="stretch" spacing={3}>
              {messages.map((m) => (
                <Box key={m.id} borderWidth="1px" borderRadius="md" p={3}>
                  <Text fontWeight="bold">{m.name} — {m.email}</Text>
                  <Text fontSize="sm" color="gray.500">{new Date(m.created_at).toLocaleString()}</Text>
                  <Text mt={2}>{m.message}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        <CLink as={RouterLink} to="/" color="teal.500">Back to the news feed</CLink>
      </VStack>
    </Container>
  );
};

export default Settings;
