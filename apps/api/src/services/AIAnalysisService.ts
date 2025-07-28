import { pipeline } from '@xenova/transformers';
import { DatabaseService } from '../database/DatabaseService';
import { logger } from '@tradeinsight/utils';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export interface TradeAnalysisInput {
  userId: string;
  trades: any[];
  riskProfile?: {
    maxLeverage: number;
    riskTolerance: string;
    maxDrawdown: number;
  };
}

export interface AIRecommendation {
  id: string;
  symbol: string;
  recommendation: string;
  confidence: number;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  targetPrice?: number;
  stopLoss?: number;
  timeframe: string;
}

export interface RuleBasedAnalysis {
  suggestion: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high';
  category: 'drawdown' | 'leverage' | 'frequency' | 'volatility' | 'win_rate';
}

export class AIAnalysisService {
  private static classifier: any = null;
  private static initialized = false;
  private static openaiApiKey = process.env.OPENAI_API_KEY;
  private static useOpenAI = !!process.env.OPENAI_API_KEY;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('Initializing AI analysis service...');
      
      if (this.useOpenAI) {
        logger.info('Using OpenAI API for AI analysis');
        this.initialized = true;
      } else {
        logger.info('Using Transformers.js for AI analysis');
        // Initialize the text classification pipeline with a working sentiment analysis model
        this.classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        this.initialized = true;
      }
      
      logger.info('AI analysis service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI analysis service:', error);
      this.initialized = false;
    }
  }

  static async analyzeTrading(input: TradeAnalysisInput): Promise<{
    recommendations: AIRecommendation[];
    ruleBasedSuggestions: RuleBasedAnalysis[];
  }> {
    try {
      const { trades, riskProfile } = input;

      // Ensure AI service is initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // Get rule-based analysis first (always available)
      const ruleBasedSuggestions = await this.getRuleBasedAnalysis(trades, riskProfile);

      // Get ML-based recommendations if available
      let mlRecommendations: AIRecommendation[] = [];
      if (trades.length > 0) {
        if (this.useOpenAI) {
          mlRecommendations = await this.getOpenAIRecommendations(trades, riskProfile);
        } else if (this.classifier) {
          mlRecommendations = await this.getMLRecommendations(trades, riskProfile);
        }
      }

      // Store analysis results
      for (const recommendation of mlRecommendations) {
        await this.storeAnalysis(recommendation);
      }

      return {
        recommendations: mlRecommendations,
        ruleBasedSuggestions
      };

    } catch (error) {
      logger.error('Error in AI trading analysis:', error);
      
      // Fallback to rule-based analysis only
      const ruleBasedSuggestions = await this.getRuleBasedAnalysis(input.trades, input.riskProfile);
      
      return {
        recommendations: [],
        ruleBasedSuggestions
      };
    }
  }

  private static async getRuleBasedAnalysis(
    trades: any[], 
    riskProfile?: any
  ): Promise<RuleBasedAnalysis[]> {
    const suggestions: RuleBasedAnalysis[] = [];

    if (trades.length === 0) {
      return [{
        suggestion: 'Start trading to get personalized recommendations',
        rationale: 'No trading history available for analysis',
        priority: 'low',
        category: 'frequency'
      }];
    }

    // Calculate trading metrics
    const profitableTrades = trades.filter(t => t.profit > 0);
    // const _losingTrades = trades.filter(t => t.profit < 0); // Currently unused
    const winRate = (profitableTrades.length / trades.length) * 100;
    // const _totalProfit = trades.reduce((sum, t) => sum + t.profit, 0); // Currently unused
    const totalVolume = trades.reduce((sum, t) => sum + t.volume, 0);
    const avgVolume = totalVolume / trades.length;

    // Rule 1: Drawdown Analysis (highest priority)
    const drawdownPercentage = this.calculateMaxDrawdown(trades);
    const maxDrawdownLimit = riskProfile?.maxDrawdown || 10.0;
    
    if (drawdownPercentage > maxDrawdownLimit) {
      suggestions.push({
        suggestion: `Reduce position sizes - current drawdown ${drawdownPercentage.toFixed(1)}% exceeds limit`,
        rationale: `Your maximum drawdown of ${drawdownPercentage.toFixed(1)}% is above your risk tolerance of ${maxDrawdownLimit}%`,
        priority: 'high',
        category: 'drawdown'
      });
    }

    // Rule 2: Win Rate Analysis
    if (winRate < 40) {
      suggestions.push({
        suggestion: 'Review trading strategy - low win rate detected',
        rationale: `Current win rate of ${winRate.toFixed(1)}% suggests strategy refinement needed`,
        priority: 'high',
        category: 'win_rate'
      });
    }

    // Rule 3: Trade Frequency Analysis
    if (trades.length < 5) {
      suggestions.push({
        suggestion: 'Increase trading frequency for better statistical analysis',
        rationale: `Only ${trades.length} trades completed - need more data for reliable insights`,
        priority: 'medium',
        category: 'frequency'
      });
    }

    // Rule 4: Volume Analysis
    if (avgVolume > 1.0) {
      suggestions.push({
        suggestion: 'Consider reducing lot sizes to manage risk',
        rationale: `Average trade volume of ${avgVolume.toFixed(2)} lots may be too high for account size`,
        priority: 'medium',
        category: 'leverage'
      });
    }

    // Rule 5: Volatility Analysis (symbol-specific)
    const symbolGroups = this.groupTradesBySymbol(trades);
    for (const [symbol, symbolTrades] of Object.entries(symbolGroups)) {
      const symbolProfitVariance = this.calculateProfitVariance(symbolTrades as any[]);
      if (symbolProfitVariance > 1000) { // High variance threshold
        suggestions.push({
          suggestion: `Reduce exposure to ${symbol} - high volatility detected`,
          rationale: `${symbol} shows high profit variance, indicating increased risk`,
          priority: 'medium',
          category: 'volatility'
        });
      }
    }

    // Prioritize suggestions (max 3)
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 3);
  }

  private static async getOpenAIRecommendations(
    trades: any[], 
    riskProfile?: any
  ): Promise<AIRecommendation[]> {
    if (!this.openaiApiKey || trades.length === 0) {
      return [];
    }

    try {
      const recommendations: AIRecommendation[] = [];
      const symbols = [...new Set(trades.map(t => t.symbol))];

      for (const symbol of symbols.slice(0, 3)) { // Limit to 3 symbols
        const symbolTrades = trades.filter(t => t.symbol === symbol);
        
        // Create trading context for OpenAI analysis
        const tradingContext = this.createDetailedTradingContext(symbolTrades, symbol, riskProfile);
        
        const prompt = `Analyze the following trading data and provide a specific recommendation:

${tradingContext}

Please provide:
1. A specific trading recommendation for ${symbol}
2. Your confidence level (0-1)
3. Risk assessment (low/medium/high)
4. Brief reasoning (max 100 words)

Format your response as JSON with keys: recommendation, confidence, riskLevel, reasoning`;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional trading analyst providing actionable trading recommendations based on historical data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        }, {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data?.choices?.[0]?.message?.content) {
          try {
            const aiResponse = JSON.parse(response.data.choices[0].message.content);
            
            // Only include high-confidence predictions
            if (aiResponse.confidence > 0.7) {
              recommendations.push({
                id: uuidv4(),
                symbol,
                recommendation: aiResponse.recommendation,
                confidence: aiResponse.confidence,
                reasoning: aiResponse.reasoning,
                riskLevel: aiResponse.riskLevel,
                timeframe: '1H',
              });
            }
          } catch (parseError) {
            logger.warn(`Failed to parse OpenAI response for ${symbol}:`, parseError);
          }
        }
      }

      return recommendations;

    } catch (error) {
      logger.error('Error in OpenAI recommendation generation:', error);
      return [];
    }
  }

  private static async getMLRecommendations(
    trades: any[], 
    riskProfile?: any
  ): Promise<AIRecommendation[]> {
    if (!this.classifier || trades.length === 0) {
      return [];
    }

    try {
      const recommendations: AIRecommendation[] = [];
      const symbols = [...new Set(trades.map(t => t.symbol))];

      for (const symbol of symbols.slice(0, 3)) { // Limit to 3 symbols
        const symbolTrades = trades.filter(t => t.symbol === symbol);
        
        // Create trading context text for ML analysis
        const tradingContext = this.createTradingContext(symbolTrades, symbol, riskProfile);
        
        // Get ML classification
        const result = await this.classifier(tradingContext);
        
        if (result && result.length > 0) {
          const confidence = result[0].score;
          
          // Only include high-confidence predictions
          if (confidence > 0.7) {
            recommendations.push({
              id: uuidv4(),
              symbol,
              recommendation: this.generateRecommendationText(result[0].label, symbol, symbolTrades),
              confidence,
              reasoning: this.generateReasoning(symbolTrades, symbol),
              riskLevel: this.assessRiskLevel(symbolTrades, riskProfile),
              timeframe: '1H',
            });
          }
        }
      }

      return recommendations;

    } catch (error) {
      logger.error('Error in ML recommendation generation:', error);
      return [];
    }
  }

  private static createTradingContext(trades: any[], symbol: string, riskProfile?: any): string {
    const profitableTrades = trades.filter(t => t.profit > 0).length;
    const totalTrades = trades.length;
    const winRate = (profitableTrades / totalTrades) * 100;
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    const avgVolume = trades.reduce((sum, t) => sum + t.volume, 0) / totalTrades;
    
    return `Trading analysis for ${symbol}: ${totalTrades} trades executed with ${winRate.toFixed(1)}% win rate. Total profit: ${totalProfit.toFixed(2)}. Average volume: ${avgVolume.toFixed(2)} lots. Risk tolerance: ${riskProfile?.riskTolerance || 'medium'}.`;
  }

  private static createDetailedTradingContext(trades: any[], symbol: string, riskProfile?: any): string {
    const profitableTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);
    const totalTrades = trades.length;
    const winRate = (profitableTrades.length / totalTrades) * 100;
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    const avgVolume = trades.reduce((sum, t) => sum + t.volume, 0) / totalTrades;
    const maxDrawdown = this.calculateMaxDrawdown(trades);
    
    const avgWin = profitableTrades.length > 0 
      ? profitableTrades.reduce((sum, t) => sum + t.profit, 0) / profitableTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length)
      : 0;
    
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    return `Symbol: ${symbol}
Total Trades: ${totalTrades}
Win Rate: ${winRate.toFixed(1)}%
Total P&L: ${totalProfit.toFixed(2)}
Average Volume: ${avgVolume.toFixed(2)} lots
Max Drawdown: ${maxDrawdown.toFixed(1)}%
Average Win: ${avgWin.toFixed(2)}
Average Loss: ${avgLoss.toFixed(2)}
Profit Factor: ${profitFactor.toFixed(2)}
Risk Profile: Max Leverage ${riskProfile?.maxLeverage || 100}x, Risk Tolerance: ${riskProfile?.riskTolerance || 'medium'}, Max Drawdown Limit: ${riskProfile?.maxDrawdown || 10}%`;
  }

  private static generateRecommendationText(label: string, symbol: string, trades: any[]): string {
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    
    if (totalProfit > 0) {
      return `Continue current strategy for ${symbol} - showing positive performance`;
    } else {
      return `Consider reducing position size for ${symbol} trades`;
    }
  }

  private static generateReasoning(trades: any[], _symbol: string): string {
    const winRate = (trades.filter(t => t.profit > 0).length / trades.length) * 100;
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    
    return `Based on ${trades.length} trades with ${winRate.toFixed(1)}% win rate and total P&L of ${totalProfit.toFixed(2)}`;
  }

  private static assessRiskLevel(trades: any[], riskProfile?: any): 'low' | 'medium' | 'high' {
    const avgVolume = trades.reduce((sum, t) => sum + t.volume, 0) / trades.length;
    const maxLeverage = riskProfile?.maxLeverage || 100;
    
    if (avgVolume > 1.0 || maxLeverage > 200) return 'high';
    if (avgVolume > 0.5 || maxLeverage > 100) return 'medium';
    return 'low';
  }

  private static calculateMaxDrawdown(trades: any[]): number {
    if (trades.length === 0) return 0;
    
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;
    
    for (const trade of trades.sort((a, b) => a.mt5_time - b.mt5_time)) {
      runningTotal += trade.profit;
      
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      
      const drawdown = ((peak - runningTotal) / Math.abs(peak)) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  private static groupTradesBySymbol(trades: any[]): Record<string, any[]> {
    return trades.reduce((groups, trade) => {
      const symbol = trade.symbol;
      if (!groups[symbol]) {
        groups[symbol] = [];
      }
      groups[symbol].push(trade);
      return groups;
    }, {});
  }

  private static calculateProfitVariance(trades: any[]): number {
    if (trades.length < 2) return 0;
    
    const profits = trades.map(t => t.profit);
    const mean = profits.reduce((sum, p) => sum + p, 0) / profits.length;
    const variance = profits.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / profits.length;
    
    return variance;
  }

  private static async storeAnalysis(recommendation: AIRecommendation): Promise<void> {
    try {
      await DatabaseService.run(
        `INSERT INTO ai_analyses 
         (id, symbol, recommendation, confidence, reasoning, risk_level, target_price, stop_loss, timeframe) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recommendation.id,
          recommendation.symbol,
          recommendation.recommendation,
          recommendation.confidence,
          recommendation.reasoning,
          recommendation.riskLevel,
          recommendation.targetPrice || null,
          recommendation.stopLoss || null,
          recommendation.timeframe
        ]
      );
    } catch (error) {
      logger.error('Error storing AI analysis:', error);
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();