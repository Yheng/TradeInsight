import { pipeline } from '@xenova/transformers';
import { DatabaseService } from '../database/DatabaseService';
import { logger } from '@tradeinsight/utils';
import { v4 as uuidv4 } from 'uuid';

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

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('Initializing AI analysis service...');
      
      // Initialize the text classification pipeline
      this.classifier = await pipeline('text-classification', 'distilbert-base-uncased', {
        revision: 'main',
      });
      
      this.initialized = true;
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
      const { userId, trades, riskProfile } = input;

      // Ensure AI service is initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // Get rule-based analysis first (always available)
      const ruleBasedSuggestions = await this.getRuleBasedAnalysis(trades, riskProfile);

      // Get ML-based recommendations if available
      let mlRecommendations: AIRecommendation[] = [];
      if (this.classifier && trades.length > 0) {
        mlRecommendations = await this.getMLRecommendations(trades, riskProfile);
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
    const losingTrades = trades.filter(t => t.profit < 0);
    const winRate = (profitableTrades.length / trades.length) * 100;
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
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

  private static generateRecommendationText(label: string, symbol: string, trades: any[]): string {
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    
    if (totalProfit > 0) {
      return `Continue current strategy for ${symbol} - showing positive performance`;
    } else {
      return `Consider reducing position size for ${symbol} trades`;
    }
  }

  private static generateReasoning(trades: any[], symbol: string): string {
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