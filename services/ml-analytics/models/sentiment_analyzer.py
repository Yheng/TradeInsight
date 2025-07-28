"""
Sentiment Analysis Model for market sentiment from news and social media
Uses NLP and machine learning for financial sentiment analysis
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
import logging
import requests
import re
from collections import Counter
import joblib
import os

# NLP libraries
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logging.warning("Transformers library not available. Using rule-based sentiment analysis.")

# Text processing
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from textblob import TextBlob

logger = logging.getLogger(__name__)

class SentimentAnalysisModel:
    """
    Advanced sentiment analysis for financial markets
    Combines multiple approaches: rule-based, transformer models, and financial lexicons
    """
    
    def __init__(self):
        self.last_trained = None
        self.version = "1.0"
        self.last_accuracy = None
        self.training_samples = None
        
        # Initialize sentiment analyzers
        self.analyzers = {}
        self._initialize_analyzers()
        
        # Financial sentiment keywords
        self.bullish_keywords = {
            'bullish', 'bull', 'buy', 'long', 'positive', 'growth', 'rise', 'up', 'gain',
            'profit', 'strong', 'rally', 'surge', 'boom', 'support', 'breakout', 'uptrend',
            'optimistic', 'confident', 'upgrade', 'outperform', 'beat', 'exceed'
        }
        
        self.bearish_keywords = {
            'bearish', 'bear', 'sell', 'short', 'negative', 'decline', 'fall', 'down', 'loss',
            'weak', 'crash', 'plunge', 'recession', 'resistance', 'breakdown', 'downtrend',
            'pessimistic', 'concerned', 'downgrade', 'underperform', 'miss', 'below'
        }
        
        # News sources and their reliability weights
        self.news_sources = {
            'reuters': 1.0,
            'bloomberg': 1.0,
            'wsj': 0.9,
            'ft': 0.9,
            'cnbc': 0.8,
            'marketwatch': 0.7,
            'yahoo': 0.6,
            'seeking_alpha': 0.5
        }
        
        # Social media sentiment weights
        self.social_weights = {
            'twitter': 0.3,
            'reddit': 0.4,
            'stocktwits': 0.6,
            'discord': 0.2
        }
    
    def _initialize_analyzers(self):
        """Initialize various sentiment analysis models"""
        try:
            # NLTK VADER sentiment analyzer
            nltk.download('vader_lexicon', quiet=True)
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            
            self.analyzers['vader'] = SentimentIntensityAnalyzer()
            
            # Initialize FinBERT for financial sentiment if available
            if TRANSFORMERS_AVAILABLE:
                try:
                    self.analyzers['finbert'] = pipeline(
                        "sentiment-analysis",
                        model="ProsusAI/finbert",
                        tokenizer="ProsusAI/finbert"
                    )
                    logger.info("FinBERT model loaded successfully")
                except Exception as e:
                    logger.warning(f"Failed to load FinBERT: {e}")
            
            logger.info("Sentiment analyzers initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize sentiment analyzers: {e}")
    
    def analyze_sentiment(self, symbol: str, sources: List[str], 
                         lookback_days: int = 7) -> Dict[str, Any]:
        """
        Analyze market sentiment from multiple sources
        
        Args:
            symbol: Trading symbol (e.g., 'EURUSD')
            sources: List of sources to analyze ['news', 'twitter', 'reddit']
            lookback_days: Number of days to look back
        
        Returns:
            Comprehensive sentiment analysis results
        """
        try:
            sentiment_results = {
                'sources': {},
                'trend_data': [],
                'impact': {}
            }
            
            # Analyze each source
            for source in sources:
                if source == 'news':
                    source_result = self._analyze_news_sentiment(symbol, lookback_days)
                elif source == 'twitter':
                    source_result = self._analyze_twitter_sentiment(symbol, lookback_days)
                elif source == 'reddit':
                    source_result = self._analyze_reddit_sentiment(symbol, lookback_days)
                else:
                    logger.warning(f"Unknown sentiment source: {source}")
                    continue
                
                sentiment_results['sources'][source] = source_result
            
            # Calculate overall sentiment
            overall_sentiment = self._calculate_overall_sentiment(sentiment_results['sources'])
            sentiment_results.update(overall_sentiment)
            
            # Generate trend data
            sentiment_results['trend_data'] = self._generate_sentiment_trend(
                symbol, sources, lookback_days
            )
            
            # Predict market impact
            sentiment_results['impact'] = self._predict_sentiment_impact(
                overall_sentiment, symbol
            )
            
            return sentiment_results
            
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return self._get_default_sentiment()
    
    def _analyze_news_sentiment(self, symbol: str, lookback_days: int) -> Dict[str, Any]:
        """Analyze sentiment from financial news"""
        try:
            # In a real implementation, this would fetch news from APIs like:
            # - NewsAPI, Alpha Vantage, Polygon, or financial news RSS feeds
            
            # Simulated news data for demonstration
            news_articles = self._get_simulated_news_data(symbol, lookback_days)
            
            sentiments = []
            keywords = []
            
            for article in news_articles:
                # Analyze sentiment using multiple methods
                sentiment_scores = self._analyze_text_sentiment(article['content'])
                
                # Weight by source reliability
                source_weight = self.news_sources.get(article.get('source', 'unknown'), 0.5)
                weighted_score = sentiment_scores['compound'] * source_weight
                
                sentiments.append(weighted_score)
                
                # Extract keywords
                article_keywords = self._extract_keywords(article['content'])
                keywords.extend(article_keywords)
            
            # Calculate aggregated sentiment
            if sentiments:
                avg_sentiment = np.mean(sentiments)
                confidence = self._calculate_confidence(sentiments)
                
                # Determine sentiment label
                if avg_sentiment > 0.1:
                    label = 'bullish'
                elif avg_sentiment < -0.1:
                    label = 'bearish'
                else:
                    label = 'neutral'
            else:
                avg_sentiment = 0.0
                confidence = 0.0
                label = 'neutral'
            
            # Get top keywords
            top_keywords = [word for word, count in Counter(keywords).most_common(20)]
            
            return {
                'score': avg_sentiment,
                'label': label,
                'confidence': confidence,
                'count': len(news_articles),
                'keywords': top_keywords
            }
            
        except Exception as e:
            logger.error(f"News sentiment analysis error: {e}")
            return {
                'score': 0.0,
                'label': 'neutral',
                'confidence': 0.0,
                'count': 0,
                'keywords': []
            }
    
    def _analyze_twitter_sentiment(self, symbol: str, lookback_days: int) -> Dict[str, Any]:
        """Analyze sentiment from Twitter/X posts"""
        try:
            # In a real implementation, this would use Twitter API v2
            # For now, return simulated data
            
            tweets = self._get_simulated_twitter_data(symbol, lookback_days)
            
            sentiments = []
            keywords = []
            
            for tweet in tweets:
                sentiment_scores = self._analyze_text_sentiment(tweet['text'])
                
                # Weight by follower count and engagement
                influence_weight = min(tweet.get('followers', 100) / 10000, 2.0)
                engagement_weight = tweet.get('retweets', 0) * 0.1 + tweet.get('likes', 0) * 0.05
                total_weight = max(0.1, min(2.0, influence_weight + engagement_weight))
                
                weighted_score = sentiment_scores['compound'] * total_weight
                sentiments.append(weighted_score)
                
                tweet_keywords = self._extract_keywords(tweet['text'])
                keywords.extend(tweet_keywords)
            
            # Calculate aggregated sentiment
            if sentiments:
                avg_sentiment = np.mean(sentiments)
                confidence = self._calculate_confidence(sentiments)
                
                if avg_sentiment > 0.1:
                    label = 'bullish'
                elif avg_sentiment < -0.1:
                    label = 'bearish'
                else:
                    label = 'neutral'
            else:
                avg_sentiment = 0.0
                confidence = 0.0
                label = 'neutral'
            
            top_keywords = [word for word, count in Counter(keywords).most_common(15)]
            
            return {
                'score': avg_sentiment,
                'label': label,
                'confidence': confidence,
                'count': len(tweets),
                'keywords': top_keywords
            }
            
        except Exception as e:
            logger.error(f"Twitter sentiment analysis error: {e}")
            return {
                'score': 0.0,
                'label': 'neutral',
                'confidence': 0.0,
                'count': 0,
                'keywords': []
            }
    
    def _analyze_reddit_sentiment(self, symbol: str, lookback_days: int) -> Dict[str, Any]:
        """Analyze sentiment from Reddit posts and comments"""
        try:
            # In a real implementation, this would use Reddit API (PRAW)
            # For now, return simulated data
            
            reddit_posts = self._get_simulated_reddit_data(symbol, lookback_days)
            
            sentiments = []
            keywords = []
            
            for post in reddit_posts:
                sentiment_scores = self._analyze_text_sentiment(post['content'])
                
                # Weight by upvotes and subreddit quality
                upvote_weight = max(0.1, min(2.0, post.get('upvotes', 1) / 100))
                subreddit_weight = {
                    'forex': 0.8,
                    'trading': 0.7,
                    'investing': 0.6,
                    'wallstreetbets': 0.4
                }.get(post.get('subreddit', 'unknown'), 0.3)
                
                total_weight = upvote_weight * subreddit_weight
                weighted_score = sentiment_scores['compound'] * total_weight
                sentiments.append(weighted_score)
                
                post_keywords = self._extract_keywords(post['content'])
                keywords.extend(post_keywords)
            
            # Calculate aggregated sentiment
            if sentiments:
                avg_sentiment = np.mean(sentiments)
                confidence = self._calculate_confidence(sentiments)
                
                if avg_sentiment > 0.1:
                    label = 'bullish'
                elif avg_sentiment < -0.1:
                    label = 'bearish'
                else:
                    label = 'neutral'
            else:
                avg_sentiment = 0.0
                confidence = 0.0
                label = 'neutral'
            
            top_keywords = [word for word, count in Counter(keywords).most_common(15)]
            
            return {
                'score': avg_sentiment,
                'label': label,
                'confidence': confidence,
                'count': len(reddit_posts),
                'keywords': top_keywords
            }
            
        except Exception as e:
            logger.error(f"Reddit sentiment analysis error: {e}")
            return {
                'score': 0.0,
                'label': 'neutral',
                'confidence': 0.0,
                'count': 0,
                'keywords': []
            }
    
    def _analyze_text_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze sentiment of a single text using multiple methods"""
        try:
            sentiments = {}
            
            # VADER sentiment analysis
            if 'vader' in self.analyzers:
                vader_scores = self.analyzers['vader'].polarity_scores(text)
                sentiments['vader'] = vader_scores['compound']
            
            # FinBERT analysis if available
            if 'finbert' in self.analyzers:
                try:
                    finbert_result = self.analyzers['finbert'](text[:512])  # Truncate to model limit
                    finbert_score = finbert_result[0]['score']
                    if finbert_result[0]['label'] == 'negative':
                        finbert_score = -finbert_score
                    elif finbert_result[0]['label'] == 'neutral':
                        finbert_score = 0.0
                    sentiments['finbert'] = finbert_score
                except Exception as e:
                    logger.debug(f"FinBERT analysis failed: {e}")
            
            # TextBlob sentiment
            try:
                blob = TextBlob(text)
                sentiments['textblob'] = blob.sentiment.polarity
            except:
                pass
            
            # Rule-based financial sentiment
            financial_sentiment = self._calculate_financial_sentiment(text)
            sentiments['financial'] = financial_sentiment
            
            # Combine sentiments (weighted average)
            if sentiments:
                weights = {
                    'vader': 0.3,
                    'finbert': 0.4,
                    'textblob': 0.2,
                    'financial': 0.1
                }
                
                weighted_sum = sum(score * weights.get(method, 0.25) 
                                 for method, score in sentiments.items())
                total_weight = sum(weights.get(method, 0.25) 
                                 for method in sentiments.keys())
                
                compound_score = weighted_sum / total_weight if total_weight > 0 else 0.0
            else:
                compound_score = 0.0
            
            return {
                'compound': compound_score,
                'individual': sentiments
            }
            
        except Exception as e:
            logger.error(f"Text sentiment analysis error: {e}")
            return {'compound': 0.0, 'individual': {}}
    
    def _calculate_financial_sentiment(self, text: str) -> float:
        """Calculate sentiment using financial keywords"""
        try:
            # Clean and tokenize text
            text_lower = text.lower()
            words = re.findall(r'\b\w+\b', text_lower)
            
            bullish_count = sum(1 for word in words if word in self.bullish_keywords)
            bearish_count = sum(1 for word in words if word in self.bearish_keywords)
            
            total_keywords = bullish_count + bearish_count
            if total_keywords == 0:
                return 0.0
            
            # Calculate sentiment score
            sentiment_score = (bullish_count - bearish_count) / total_keywords
            
            # Apply intensity scaling based on keyword density
            keyword_density = total_keywords / len(words) if words else 0
            intensity_multiplier = min(2.0, 1.0 + keyword_density * 10)
            
            return sentiment_score * intensity_multiplier
            
        except Exception as e:
            logger.error(f"Financial sentiment calculation error: {e}")
            return 0.0
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text"""
        try:
            # Clean text
            text_lower = text.lower()
            words = re.findall(r'\b\w+\b', text_lower)
            
            # Filter out stop words
            try:
                stop_words = set(stopwords.words('english'))
            except:
                stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            
            # Keep only relevant financial and sentiment keywords
            relevant_keywords = []
            for word in words:
                if (len(word) > 2 and 
                    word not in stop_words and
                    (word in self.bullish_keywords or 
                     word in self.bearish_keywords or
                     word in {'forex', 'trading', 'market', 'price', 'eur', 'usd', 'gbp', 'jpy', 'fed', 'ecb', 'boe'})):
                    relevant_keywords.append(word)
            
            return relevant_keywords
            
        except Exception as e:
            logger.error(f"Keyword extraction error: {e}")
            return []
    
    def _calculate_overall_sentiment(self, source_results: Dict[str, Dict]) -> Dict[str, Any]:
        """Calculate overall sentiment from multiple sources"""
        try:
            if not source_results:
                return {
                    'overall_score': 0.0,
                    'overall_label': 'neutral',
                    'confidence': 0.0
                }
            
            # Weight sources by reliability and sample size
            weighted_scores = []
            total_confidence = 0
            
            for source, result in source_results.items():
                score = result.get('score', 0)
                confidence = result.get('confidence', 0)
                count = result.get('count', 0)
                
                # Apply source-specific weights
                if source == 'news':
                    source_weight = 0.5
                elif source == 'twitter':
                    source_weight = 0.3
                elif source == 'reddit':
                    source_weight = 0.2
                else:
                    source_weight = 0.1
                
                # Apply sample size weighting
                sample_weight = min(1.0, count / 50)  # Normalize to 50 samples
                
                # Combined weight
                combined_weight = source_weight * sample_weight * confidence
                
                if combined_weight > 0:
                    weighted_scores.append(score * combined_weight)
                    total_confidence += combined_weight
            
            # Calculate overall sentiment
            if weighted_scores and total_confidence > 0:
                overall_score = sum(weighted_scores) / total_confidence
                overall_confidence = min(1.0, total_confidence)
                
                # Determine label
                if overall_score > 0.1:
                    overall_label = 'bullish'
                elif overall_score < -0.1:
                    overall_label = 'bearish'
                else:
                    overall_label = 'neutral'
            else:
                overall_score = 0.0
                overall_confidence = 0.0
                overall_label = 'neutral'
            
            return {
                'overall_score': overall_score,
                'overall_label': overall_label,
                'confidence': overall_confidence
            }
            
        except Exception as e:
            logger.error(f"Overall sentiment calculation error: {e}")
            return {
                'overall_score': 0.0,
                'overall_label': 'neutral',
                'confidence': 0.0
            }
    
    def _calculate_confidence(self, sentiments: List[float]) -> float:
        """Calculate confidence score based on sentiment consistency"""
        if not sentiments:
            return 0.0
        
        # Calculate standard deviation (lower = more consistent = higher confidence)
        std_dev = np.std(sentiments)
        mean_abs = np.mean(np.abs(sentiments))
        
        # Confidence is higher when:
        # 1. Sentiments are consistent (low std dev)
        # 2. Sentiments are not near zero (high mean absolute value)
        consistency_score = max(0, 1 - std_dev)
        strength_score = min(1, mean_abs * 2)
        
        confidence = (consistency_score + strength_score) / 2
        return confidence
    
    def _generate_sentiment_trend(self, symbol: str, sources: List[str], 
                                lookback_days: int) -> List[Dict[str, Any]]:
        """Generate sentiment trend data over time"""
        try:
            trend_data = []
            
            # Generate daily sentiment data for the lookback period
            for i in range(lookback_days):
                date = datetime.utcnow() - timedelta(days=i)
                
                # Simulate daily sentiment (in real implementation, query historical data)
                base_sentiment = np.random.normal(0, 0.3)
                volume = max(1, int(np.random.exponential(50)))
                
                trend_data.append({
                    'date': date,
                    'score': base_sentiment,
                    'volume': volume
                })
            
            # Sort by date (oldest first)
            trend_data.sort(key=lambda x: x['date'])
            
            return trend_data
            
        except Exception as e:
            logger.error(f"Sentiment trend generation error: {e}")
            return []
    
    def _predict_sentiment_impact(self, overall_sentiment: Dict[str, Any], 
                                symbol: str) -> Dict[str, Any]:
        """Predict potential market impact of sentiment"""
        try:
            score = overall_sentiment.get('overall_score', 0)
            confidence = overall_sentiment.get('confidence', 0)
            
            # Impact strength based on sentiment score and confidence
            impact_strength = abs(score) * confidence
            
            # Predict short-term impact (1-3 days)
            if impact_strength > 0.5:
                if score > 0:
                    short_term = 'bullish_strong'
                else:
                    short_term = 'bearish_strong'
            elif impact_strength > 0.3:
                if score > 0:
                    short_term = 'bullish_moderate'
                else:
                    short_term = 'bearish_moderate'
            else:
                short_term = 'neutral'
            
            # Predict medium-term impact (1-2 weeks)
            # Medium-term impact is usually weaker
            if impact_strength > 0.7:
                if score > 0:
                    medium_term = 'bullish_moderate'
                else:
                    medium_term = 'bearish_moderate'
            elif impact_strength > 0.5:
                if score > 0:
                    medium_term = 'bullish_weak'
                else:
                    medium_term = 'bearish_weak'
            else:
                medium_term = 'neutral'
            
            return {
                'short_term': short_term,
                'medium_term': medium_term,
                'confidence': confidence
            }
            
        except Exception as e:
            logger.error(f"Sentiment impact prediction error: {e}")
            return {
                'short_term': 'neutral',
                'medium_term': 'neutral',
                'confidence': 0.0
            }
    
    def _get_simulated_news_data(self, symbol: str, lookback_days: int) -> List[Dict[str, Any]]:
        """Generate simulated news data for demonstration"""
        news_templates = [
            f"ECB officials express optimism about eurozone growth prospects amid {symbol} strength",
            f"Market volatility increases as {symbol} faces headwinds from global uncertainty",
            f"Technical analysis suggests {symbol} may break key resistance levels",
            f"Central bank policy divergence impacts {symbol} trading patterns",
            f"Strong economic data supports bullish outlook for {symbol}",
            f"Geopolitical tensions create downward pressure on {symbol}",
            f"Institutional investors increase {symbol} allocations following positive signals",
            f"Risk-off sentiment weighs on {symbol} as investors seek safe havens"
        ]
        
        news_articles = []
        for i in range(min(20, lookback_days * 3)):
            template = np.random.choice(news_templates)
            article = {
                'content': template,
                'source': np.random.choice(list(self.news_sources.keys())),
                'timestamp': datetime.utcnow() - timedelta(hours=np.random.randint(0, lookback_days * 24))
            }
            news_articles.append(article)
        
        return news_articles
    
    def _get_simulated_twitter_data(self, symbol: str, lookback_days: int) -> List[Dict[str, Any]]:
        """Generate simulated Twitter data for demonstration"""
        tweet_templates = [
            f"Bullish on {symbol} - technical setup looks strong 📈",
            f"{symbol} breaking out! Time to go long? 🚀",
            f"Bearish divergence forming on {symbol} charts 📉",
            f"Just closed my {symbol} position with decent profit 💰",
            f"{symbol} looking weak here, might short it",
            f"Central bank meeting could impact {symbol} significantly",
            f"Risk management is key when trading {symbol}",
            f"Anyone else seeing this {symbol} pattern forming?"
        ]
        
        tweets = []
        for i in range(min(100, lookback_days * 15)):
            template = np.random.choice(tweet_templates)
            tweet = {
                'text': template,
                'followers': np.random.randint(100, 10000),
                'retweets': np.random.randint(0, 50),
                'likes': np.random.randint(0, 200),
                'timestamp': datetime.utcnow() - timedelta(hours=np.random.randint(0, lookback_days * 24))
            }
            tweets.append(tweet)
        
        return tweets
    
    def _get_simulated_reddit_data(self, symbol: str, lookback_days: int) -> List[Dict[str, Any]]:
        """Generate simulated Reddit data for demonstration"""
        reddit_templates = [
            f"DD: Why I think {symbol} is undervalued right now",
            f"Technical analysis on {symbol} - multiple confluences",
            f"Fundamental outlook for {symbol} looks promising",
            f"Risk management strategies for {symbol} trading",
            f"Market maker manipulation on {symbol}? Thoughts?",
            f"Long-term bullish case for {symbol} remains intact",
            f"Short squeeze potential in {symbol}?",
            f"Central bank policy impact on {symbol} pairs"
        ]
        
        posts = []
        for i in range(min(50, lookback_days * 7)):
            template = np.random.choice(reddit_templates)
            post = {
                'content': template,
                'upvotes': np.random.randint(1, 500),
                'subreddit': np.random.choice(['forex', 'trading', 'investing', 'wallstreetbets']),
                'timestamp': datetime.utcnow() - timedelta(hours=np.random.randint(0, lookback_days * 24))
            }
            posts.append(post)
        
        return posts
    
    def _get_default_sentiment(self) -> Dict[str, Any]:
        """Return default neutral sentiment"""
        return {
            'overall_score': 0.0,
            'overall_label': 'neutral',
            'confidence': 0.0,
            'sources': {},
            'trend_data': [],
            'impact': {
                'short_term': 'neutral',
                'medium_term': 'neutral',
                'confidence': 0.0
            }
        }
    
    def retrain(self, force_retrain: bool = False) -> Dict[str, Any]:
        """Retrain sentiment analysis models"""
        # Sentiment analysis models are primarily rule-based and pre-trained
        # Retraining would involve updating keyword lists and weights
        self.last_trained = datetime.utcnow()
        
        return {
            'training_samples': 10000,  # Simulated
            'validation_score': 0.75,  # Estimated accuracy
            'training_time': 5,
            'version': self.version
        }