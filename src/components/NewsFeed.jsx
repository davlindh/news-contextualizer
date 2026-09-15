import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack, Spinner, Link, HStack, IconButton, Button, Input, SimpleGrid, Image, Select, Tooltip, Alert, AlertIcon } from "@chakra-ui/react";
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { scoreArticlesByRelevance } from '../utils/relevanceScoring';
import { summarizeArticle } from '../utils/metaContextual';

const NewsFeed = ({ sortOption, category, source, tag }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [provider, setProvider] = useState('hackernews');
  const [error, setError] = useState(null);
  const articlesPerPage = 24;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const storedFeedback = localStorage.getItem('feedback');
    if (storedFeedback) setFeedback(JSON.parse(storedFeedback));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async (chosenProvider, fallbackNotice) => {
      const { data, error: fnError } = await supabase.functions.invoke('news', {
        body: {
          provider: chosenProvider,
          query: debouncedQuery || tag || '',
          category,
          source,
          page: 1,
        },
      });

      if (fnError) {
        let payload = {};
        try { payload = JSON.parse(await fnError.context.text()); } catch { /* ignore */ }
        if (payload.error === 'missing_key' && chosenProvider !== 'hackernews') {
          return load('hackernews', `No ${chosenProvider === 'gnews' ? 'GNews' : 'NewsAPI'} key saved yet — showing Hacker News instead.`);
        }
        if (chosenProvider !== 'hackernews') {
          return load('hackernews', 'That news service could not be reached — showing Hacker News instead.');
        }
        if (!cancelled) {
          setError('Could not load news right now. Please try again shortly.');
          setArticles([]);
          setLoading(false);
        }
        return;
      }

      if (cancelled) return;
      const list = (data?.articles || []).filter((a) => a && a.title);
      let scored = scoreArticlesByRelevance(list, feedback, '');
      if (sortOption === 'date') {
        scored = [...scored].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      } else if (sortOption === 'popularity') {
        scored = [...scored].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      }
      setArticles(scored);
      setError(fallbackNotice || null);
      setCurrentPage(1);
      setLoading(false);
    };

    setLoading(true);
    load(provider);
    return () => { cancelled = true; };
  }, [provider, debouncedQuery, category, source, tag, sortOption, feedback]);

  const handleFeedback = (key, type) => {
    const newFeedback = { ...feedback };
    if (!newFeedback[key]) newFeedback[key] = { up: 0, down: 0 };
    newFeedback[key] = { ...newFeedback[key], [type]: newFeedback[key][type] + 1 };
    setFeedback(newFeedback);
    localStorage.setItem('feedback', JSON.stringify(newFeedback));
  };

  const totalPages = Math.max(1, Math.ceil(articles.length / articlesPerPage));
  const indexOfLastArticle = currentPage * articlesPerPage;
  const currentArticles = articles.slice(indexOfLastArticle - articlesPerPage, indexOfLastArticle);

  return (
    <VStack spacing={4} align="stretch">
      <HStack>
        <Input
          placeholder="Search headlines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select width="220px" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="hackernews">Hacker News (no key)</option>
          <option value="gnews">GNews</option>
          <option value="newsapi">NewsAPI</option>
        </Select>
      </HStack>

      {error && (
        <Alert status="info">
          <AlertIcon />
          {error}
          <Link as={RouterLink} to="/settings" ml={2} color="teal.600">Add a key</Link>
        </Alert>
      )}

      {loading ? (
        <Spinner size="xl" alignSelf="center" />
      ) : (
        <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={4}>
          {currentArticles.map((article, index) => {
            const key = article.url || `${article.title}-${index}`;
            return (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} key={key}>
                <Box p={4} borderWidth="1px" borderRadius="lg" height="100%">
                  {article.urlToImage && (
                    <Image src={article.urlToImage} alt={article.title} borderRadius="md" loading="lazy" />
                  )}
                  <Heading size="md" mt={2}>
                    <Link href={article.url} isExternal>{article.title}</Link>
                  </Heading>
                  <Text mt={2}>{summarizeArticle(article.content || article.description)}</Text>
                  <Tooltip label="Published" aria-label="Published date">
                    <Text mt={2} fontSize="sm" color="gray.500">
                      {article.source?.name} · {new Date(article.publishedAt).toLocaleDateString()}
                    </Text>
                  </Tooltip>
                  <HStack mt={2}>
                    <IconButton icon={<FaThumbsUp />} onClick={() => handleFeedback(key, 'up')} aria-label="Thumbs Up" size="sm" />
                    <IconButton icon={<FaThumbsDown />} onClick={() => handleFeedback(key, 'down')} aria-label="Thumbs Down" size="sm" />
                    <Text fontSize="sm">{feedback[key]?.up || 0} up</Text>
                    <Text fontSize="sm">{feedback[key]?.down || 0} down</Text>
                  </HStack>
                </Box>
              </motion.div>
            );
          })}
        </SimpleGrid>
      )}

      {!loading && articles.length === 0 && !error && <Text>No headlines matched that search.</Text>}

      {totalPages > 1 && (
        <HStack spacing={2} mt={4} justifyContent="center">
          <Button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} isDisabled={currentPage === 1}>Previous</Button>
          <Text>Page {currentPage} of {totalPages}</Text>
          <Button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} isDisabled={currentPage === totalPages}>Next</Button>
        </HStack>
      )}
    </VStack>
  );
};

export default NewsFeed;
