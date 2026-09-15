import { useState } from 'react';
import { Container, VStack, Heading, Text, Input, Textarea, Button, Alert, AlertIcon, Link as CLink } from "@chakra-ui/react";
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-message', { body: form });
      if (error) {
        const details = error.context ? await error.context.text() : error.message;
        let msg = 'Something went wrong. Please try again.';
        try { msg = JSON.parse(details).error || msg; } catch { /* keep default */ }
        setStatus({ type: 'error', text: msg });
      } else {
        setStatus({ type: 'success', text: data?.emailed ? 'Thanks! Your message was sent.' : 'Thanks! Your message was received.' });
        setForm({ name: '', email: '', message: '' });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack as="form" spacing={4} align="stretch" onSubmit={handleSubmit}>
        <Heading as="h1" size="lg">Contact us</Heading>
        <Text color="gray.600">Send a message and it will land straight in our inbox.</Text>
        {status && (
          <Alert status={status.type}><AlertIcon />{status.text}</Alert>
        )}
        <Input placeholder="Your name" value={form.name} onChange={update('name')} maxLength={100} required />
        <Input type="email" placeholder="Your email" value={form.email} onChange={update('email')} maxLength={255} required />
        <Textarea placeholder="Your message" value={form.message} onChange={update('message')} rows={6} maxLength={5000} required />
        <Button type="submit" colorScheme="teal" isLoading={sending}>Send message</Button>
        <CLink as={RouterLink} to="/" color="teal.500">Back to the news feed</CLink>
      </VStack>
    </Container>
  );
};

export default Contact;
