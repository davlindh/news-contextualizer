import { useState } from 'react';
import { Container, Text, VStack, Input, Button, Box, Stack, Select, Heading, Link, Wrap, WrapItem, SimpleGrid } from "@chakra-ui/react";
import { Link as RouterLink } from 'react-router-dom';
import { analyzeQuery, matchQueryToThemes } from '../utils/nlp';
import NewsFeed from '../components/NewsFeed';

const CATEGORIES = ['technology', 'health', 'business', 'entertainment', 'sports', 'science', 'world', 'politics', 'travel', 'lifestyle'];
const TAGS = ['AI', 'COVID19', 'Elections', 'ClimateChange', 'Startups', 'Space', 'Technology', 'HealthTech', 'FinTech', 'GreenEnergy'];

const Index = () => {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [matchedThemes, setMatchedThemes] = useState(null);
  const [sortOption, setSortOption] = useState('relevance');
  const [category, setCategory] = useState('all');
  const [source, setSource] = useState('all');
  const [selectedTag, setSelectedTag] = useState(null);

  const handleAnalyze = () => {
    setAnalysis(analyzeQuery(query));
    setMatchedThemes(matchQueryToThemes(query));
  };

  const handleCategoryClick = (c) => {
    setCategory(c);
    setSelectedTag(null);
  };

  const handleTagClick = (t) => {
    setSelectedTag(t);
    setCategory('all');
  };

  return (
    <Container maxW="container.xl" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        <VStack spacing={1} align={{ base: 'start', md: 'center' }}>
          <Heading as="h1" size={{ base: 'lg', md: 'xl' }}>News Contextualizer</Heading>
          <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
            Live headlines with context, search and topic filters.
          </Text>
        </VStack>

        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
          <Input
            placeholder="Enter your query here..."
            value={query}
            size={{ base: 'md', md: 'lg' }}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={handleAnalyze} width={{ base: 'full', sm: 'auto' }} flexShrink={0}>
            Analyze
          </Button>
        </Stack>

        {analysis && (
          <Box p={4} borderWidth="1px" borderRadius="lg">
            <Text>Topics: {analysis.topics.join(', ')}</Text>
            <Text>Themes: {analysis.themes.join(', ')}</Text>
          </Box>
        )}
        {matchedThemes && (
          <Box p={4} borderWidth="1px" borderRadius="lg" overflowX="auto">
            <Text mb={2}>Matched Themes:</Text>
            <Text as="pre" fontSize="xs">{JSON.stringify(matchedThemes, null, 2)}</Text>
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
          <Select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="popularity">Popularity</option>
          </Select>
          <Select value={category} onChange={(e) => handleCategoryClick(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
            ))}
          </Select>
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="all">All sources</option>
            <option value="bbc-news">BBC News</option>
            <option value="cnn">CNN</option>
            <option value="fox-news">Fox News</option>
            <option value="the-new-york-times">The New York Times</option>
            <option value="the-guardian-uk">The Guardian</option>
          </Select>
        </SimpleGrid>

        <Box>
          <Heading size="sm" mb={2}>Trending tags</Heading>
          <Wrap>
            {TAGS.map((t) => (
              <WrapItem key={t}>
                <Button
                  size="sm"
                  variant={selectedTag === t ? 'solid' : 'outline'}
                  colorScheme="teal"
                  borderRadius="full"
                  onClick={() => handleTagClick(t)}
                >
                  #{t}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        </Box>

        <NewsFeed sortOption={sortOption} category={category} source={source} tag={selectedTag} />

        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} pt={2}>
          <Link as={RouterLink} to="/contact" color="teal.600">Contact us</Link>
          <Link as={RouterLink} to="/settings" color="teal.600">News settings</Link>
        </Stack>
      </VStack>
    </Container>
  );
};

export default Index;
