import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack, Spinner, Link, HStack, IconButton, Button, Input, SimpleGrid, Image, Select, Tooltip } from "@chakra-ui/react";
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import { scoreArticlesByRelevance } from '../utils/relevanceScoring';
import { summarizeArticle, fetchContextualLinks } from '../utils/metaContextual';
import { getSampleArticles } from '../utils/sampleArticles';

const NewsFeed = ({ sortOption, category, source, tag }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const articlesPerPage = 50;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('https://newsapi.org/v2/top-headlines', {
          params: {
            country: 'us',
            apiKey: 'YOUR_NEWS_API_KEY',
            category: category !== 'all' ? category : undefined,
            sources: source !== 'all' ? source : undefined,
            q: tag ? tag : undefined
          }
        });
        console.log('Fetched articles:', response.data.articles); // Add this line
        let scoredArticles = scoreArticlesByRelevance(response.data.articles, feedback, searchQuery);
        if (sortOption === 'date') {
          scoredArticles = scoredArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        } else if (sortOption === 'popularity') {
          scoredArticles = scoredArticles.sort((a, b) => b.popularity - a.popularity);
        }
        setArticles(scoredArticles);
        setTotalPages(Math.ceil(scoredArticles.length / articlesPerPage));
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [feedback, sortOption, category, source, searchQuery, tag]);

  useEffect(() => {
    console.log('Articles state updated:', articles); // Add this line
  }, [articles]);

  const handleFeedback = (index, type) => {
    const newFeedback = { ...feedback };
    if (!newFeedback[index]) {
      newFeedback[index] = { up: 0, down: 0 };
    }
    if (type === 'up') {
      newFeedback[index].up += 1;
    } else {
      newFeedback[index].down += 1;
    }
    setFeedback(newFeedback);
    localStorage.setItem('feedback', JSON.stringify(newFeedback));
  };

  useEffect(() => {
    const storedFeedback = localStorage.getItem('feedback');
    if (storedFeedback) {
      setFeedback(JSON.parse(storedFeedback));
    }
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      const matchedSuggestions = articles.filter(article => article.title.includes(query)).map(article => article.title);
      setSuggestions(matchedSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
    setPageInput('');
  };

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);
  console.log('Current articles:', currentArticles); // Add this line

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <Spinner size="xl" />;
  }

  return (
    <VStack spacing={4} align="stretch">
      <Input 
        placeholder="Search articles..." 
        value={searchQuery} 
        onChange={handleSearchChange} 
      />
      {suggestions.length > 0 && (
        <Box borderWidth="1px" borderRadius="lg" p={2}>
          {suggestions.map((suggestion, index) => (
            <Text key={index}>{suggestion}</Text>
          ))}
        </Box>
      )}
      <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={4}>
        {currentArticles.map((article, index) => (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} key={index}>
            <Box p={4} borderWidth="1px" borderRadius="lg">
              <Image src={article.urlToImage} alt={article.title} borderRadius="md" />
              <Tooltip label="Article Title" aria-label="Article Title Tooltip">
                <Heading size="md" mt={2}>{article.title}</Heading>
              </Tooltip>
              <Text mt={2}>{summarizeArticle(article.content)}</Text>
              <Tooltip label="Author of the article" aria-label="Author Tooltip">
                <Text mt={2} fontSize="sm" color="gray.500">By {article.author || 'Unknown Author'} on {new Date(article.publishedAt).toLocaleDateString()}</Text>
              </Tooltip>
              <Text mt={2} fontSize="sm" color="gray.500">{article.source.name}</Text>
              <VStack mt={2} align="start">
                {fetchContextualLinks(article).map((link, linkIndex) => (
                  <Link key={linkIndex} href={link.url} isExternal color="teal.500">
                    {link.title}
                  </Link>
                ))}
              </VStack>
              <HStack mt={2}>
                <IconButton
                  icon={<FaThumbsUp />}
                  onClick={() => handleFeedback(index, 'up')}
                  aria-label="Thumbs Up"
                />
                <IconButton
                  icon={<FaThumbsDown />}
                  onClick={() => handleFeedback(index, 'down')}
                  aria-label="Thumbs Down"
                />
                <Text>{feedback[index] ? feedback[index].up : 0} Upvotes</Text>
                <Text>{feedback[index] ? feedback[index].down : 0} Downvotes</Text>
              </HStack>
            </Box>
          </motion.div>
        ))}
      </SimpleGrid>
      <HStack spacing={2} mt={4} justifyContent="center">
        <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
        <Text>Page {currentPage} of {totalPages}</Text>
        <Button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
        <Input
          placeholder="Go to page..."
          value={pageInput}
          onChange={handlePageInputChange}
          width="100px"
        />
        <Button onClick={handlePageInputSubmit}>Go</Button>
      </HStack>
    </VStack>
  );
};

export default NewsFeed;