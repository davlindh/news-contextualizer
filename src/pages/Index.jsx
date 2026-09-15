import { useState } from 'react';
import { Container, Text, VStack, Input, Button, Box, HStack, Select, Flex, Heading, Link } from "@chakra-ui/react";
import { Link as RouterLink } from 'react-router-dom';
import { analyzeQuery, matchQueryToThemes } from '../utils/nlp';
import NewsFeed from '../components/NewsFeed';

const Index = () => {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [matchedThemes, setMatchedThemes] = useState(null);
  const [sortOption, setSortOption] = useState('relevance');
  const [category, setCategory] = useState('all');
  const [source, setSource] = useState('all');
  const [selectedTag, setSelectedTag] = useState(null);

  const handleAnalyze = () => {
    const result = analyzeQuery(query);
    setAnalysis(result);
    const themes = matchQueryToThemes(query);
    setMatchedThemes(themes);
  };

  const handleCategoryClick = (category) => {
    setCategory(category);
    setSelectedTag(null);
  };

  const handleTagClick = (tag) => {
    setSelectedTag(tag);
    setCategory('all');
  };

  return (
    <Container centerContent maxW="container.xl" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <VStack spacing={4} width="full">
        <Heading as="h1" size="xl">News Contextualizer</Heading>
        <Text color="gray.600">Live headlines with context, search and topic filters.</Text>
        <Input 
          placeholder="Enter your query here..." 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
        />
        <Button onClick={handleAnalyze}>Analyze Query</Button>
        {analysis && (
          <Box mt={4} p={4} borderWidth="1px" borderRadius="lg" width="full">
            <Text fontSize="lg">Topics: {analysis.topics.join(', ')}</Text>
            <Text fontSize="lg">Themes: {analysis.themes.join(', ')}</Text>
          </Box>
        )}
        {matchedThemes && (
          <Box mt={4} p={4} borderWidth="1px" borderRadius="lg" width="full">
            <Text fontSize="lg">Matched Themes:</Text>
            <pre>{JSON.stringify(matchedThemes, null, 2)}</pre>
          </Box>
        )}
        <HStack spacing={4} width="full" justifyContent="space-between">
          <Select placeholder="Sort by" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="popularity">Popularity</option>
          </Select>
          <Select placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            <option value="technology">Technology</option>
            <option value="health">Health</option>
            <option value="business">Business</option>
            <option value="entertainment">Entertainment</option>
            <option value="sports">Sports</option>
            <option value="science">Science</option>
            <option value="world">World</option>
          </Select>
          <Select placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="all">All</option>
            <option value="bbc-news">BBC News</option>
            <option value="cnn">CNN</option>
            <option value="fox-news">Fox News</option>
            <option value="the-new-york-times">The New York Times</option>
            <option value="the-guardian-uk">The Guardian</option>
          </Select>
        </HStack>
        <Flex width="full" mt={4}>
          <Box width="20%" p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
            <Heading size="md" mb={4}>Categories</Heading>
            <VStack align="start">
              <Link href="#" onClick={() => handleCategoryClick('technology')}>Technology</Link>
              <Link href="#" onClick={() => handleCategoryClick('health')}>Health</Link>
              <Link href="#" onClick={() => handleCategoryClick('business')}>Business</Link>
              <Link href="#" onClick={() => handleCategoryClick('entertainment')}>Entertainment</Link>
              <Link href="#" onClick={() => handleCategoryClick('sports')}>Sports</Link>
              <Link href="#" onClick={() => handleCategoryClick('science')}>Science</Link>
              <Link href="#" onClick={() => handleCategoryClick('world')}>World</Link>
              <Link href="#" onClick={() => handleCategoryClick('politics')}>Politics</Link>
              <Link href="#" onClick={() => handleCategoryClick('travel')}>Travel</Link>
              <Link href="#" onClick={() => handleCategoryClick('lifestyle')}>Lifestyle</Link>
            </VStack>
            <Heading size="md" mt={8} mb={4}>Trending Tags</Heading>
            <VStack align="start">
              <Link href="#" onClick={() => handleTagClick('AI')}>#AI</Link>
              <Link href="#" onClick={() => handleTagClick('COVID19')}>#COVID19</Link>
              <Link href="#" onClick={() => handleTagClick('Elections')}>#Elections</Link>
              <Link href="#" onClick={() => handleTagClick('ClimateChange')}>#ClimateChange</Link>
              <Link href="#" onClick={() => handleTagClick('Startups')}>#Startups</Link>
              <Link href="#" onClick={() => handleTagClick('Space')}>#Space</Link>
              <Link href="#" onClick={() => handleTagClick('Technology')}>#Technology</Link>
              <Link href="#" onClick={() => handleTagClick('HealthTech')}>#HealthTech</Link>
              <Link href="#" onClick={() => handleTagClick('FinTech')}>#FinTech</Link>
              <Link href="#" onClick={() => handleTagClick('GreenEnergy')}>#GreenEnergy</Link>
            </VStack>
          </Box>
          <Box width="60%" p={4}>
            <NewsFeed sortOption={sortOption} category={category} source={source} tag={selectedTag} />
          </Box>
          <Box width="20%" p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
            <Heading size="md" mb={4}>Further Reading</Heading>
            <VStack align="start">
              <Link as={RouterLink} to="/contact">Contact Us</Link>
              <Link as={RouterLink} to="/settings">News Settings</Link>
            </VStack>
          </Box>
        </Flex>
      </VStack>
    </Container>
  );
};

export default Index;