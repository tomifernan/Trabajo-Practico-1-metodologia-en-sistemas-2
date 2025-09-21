// Market analysis service with Facade pattern
import { Portfolio, RiskAnalysis } from "../models/types";
import { storage } from "../utils/storage";

/* ===== Subsystem: Risk Analysis ===== */
class RiskAnalyzer {
  analyze(portfolio: Portfolio, userId: string): RiskAnalysis {
    const diversificationScore = this.calculateDiversification(portfolio);
    const volatilityScore = this.calculateVolatility(portfolio);

    let riskLevel: "low" | "medium" | "high";
    if (volatilityScore < 30 && diversificationScore > 70) {
      riskLevel = "low";
    } else if (volatilityScore < 60 && diversificationScore > 40) {
      riskLevel = "medium";
    } else {
      riskLevel = "high";
    }

    const recommendations = this.generateRecommendations(
      diversificationScore,
      volatilityScore,
      riskLevel
    );

    const analysis = new RiskAnalysis(userId);
    analysis.updateRisk(riskLevel, diversificationScore, recommendations);

    return analysis;
  }

  private calculateDiversification(portfolio: Portfolio): number {
    if (portfolio.holdings.length === 0) return 0;

    const sectors = new Set<string>();
    portfolio.holdings.forEach((holding) => {
      const asset = storage.getAssetBySymbol(holding.symbol);
      if (asset) sectors.add(asset.sector);
    });

    const sectorCount = sectors.size;
    const maxSectors = 5;
    const sectorScore = Math.min(sectorCount / maxSectors, 1) * 50;

    const totalValue = portfolio.totalValue;
    let concentrationPenalty = 0;

    portfolio.holdings.forEach((holding) => {
      const weight = holding.currentValue / totalValue;
      if (weight > 0.3) concentrationPenalty += (weight - 0.3) * 100;
    });

    const distributionScore = Math.max(50 - concentrationPenalty, 0);
    return Math.min(sectorScore + distributionScore, 100);
  }

  private calculateVolatility(portfolio: Portfolio): number {
    if (portfolio.holdings.length === 0) return 0;

    let weightedVolatility = 0;
    const totalValue = portfolio.totalValue;

    portfolio.holdings.forEach((holding) => {
      const weight = holding.currentValue / totalValue;
      weightedVolatility += weight * this.getAssetVolatility(holding.symbol);
    });

    return Math.min(weightedVolatility, 100);
  }

  private getAssetVolatility(symbol: string): number {
    const asset = storage.getAssetBySymbol(symbol);
    if (!asset) return 50;

    const volatilityBySector: { [key: string]: number } = {
      Technology: 65,
      Healthcare: 45,
      Financial: 55,
      Automotive: 70,
      "E-commerce": 60,
    };

    return volatilityBySector[asset.sector] || 50;
  }

  private generateRecommendations(
    diversification: number,
    volatility: number,
    riskLevel: "low" | "medium" | "high"
  ): string[] {
    const recommendations: string[] = [];

    if (diversification < 40)
      recommendations.push("Consider diversifying into more sectors");
    if (volatility > 70)
      recommendations.push("Reduce volatile assets, add more stable ones");
    if (riskLevel === "high")
      recommendations.push("High risk detected, review your investment strategy");
    if (diversification > 80 && volatility < 30)
      recommendations.push("Excellent diversification and low risk, keep this strategy");

    if (recommendations.length === 0)
      recommendations.push("Portfolio looks balanced, keep monitoring");

    return recommendations;
  }
}

/* ===== Subsystem: Technical Analysis ===== */
class TechnicalAnalyzer {
  analyze(symbol: string) {
    const marketData = storage.getMarketDataBySymbol(symbol);
    if (!marketData) throw new Error("Market data not found");

    const sma20 = this.calculateSMA(marketData.price);
    const sma50 = this.calculateSMA(marketData.price);
    const rsi = this.calculateRSI();

    let signal: "buy" | "sell" | "hold" = "hold";
    if (marketData.price > sma20 && sma20 > sma50 && rsi < 70) signal = "buy";
    else if (marketData.price < sma20 && sma20 < sma50 && rsi > 30) signal = "sell";

    return {
      symbol,
      currentPrice: marketData.price,
      sma20,
      sma50,
      rsi,
      signal,
      timestamp: new Date(),
    };
  }

  private calculateSMA(price: number): number {
    const variation = (Math.random() - 0.5) * 0.1;
    return price * (1 + variation);
  }

  private calculateRSI(): number {
    return 20 + Math.random() * 60;
  }
}

/* ===== Subsystem: Investment Recommendations ===== */
class RecommendationAnalyzer {
  generate(userId: string) {
    const user = storage.getUserById(userId);
    const portfolio = storage.getPortfolioByUserId(userId);
    if (!user || !portfolio) throw new Error("User or portfolio not found");

    const recommendations: any[] = [];
    const allAssets = storage.getAllAssets();

    allAssets.forEach((asset) => {
      const hasHolding = portfolio.holdings.some((h) => h.symbol === asset.symbol);
      if (hasHolding) return;

      let text = "";
      let priority = 0;
      const volatility = Math.random() * 100;

      if (user.riskTolerance === "low" && volatility < 50) {
        text = "Low-risk asset recommended for conservative profile";
        priority = 1;
      } else if (user.riskTolerance === "high" && volatility > 60) {
        text = "High-growth potential asset for aggressive profile";
        priority = 2;
      } else if (user.riskTolerance === "medium") {
        text = "Balanced asset recommended for moderate profile";
        priority = 1;
      }

      if (text) {
        recommendations.push({
          symbol: asset.symbol,
          name: asset.name,
          currentPrice: asset.currentPrice,
          recommendation: text,
          priority,
          riskLevel: volatility > 60 ? "high" : "medium",
        });
      }
    });

    return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }
}

/* ===== Facade ===== */
export class MarketAnalysisService {
  private riskAnalyzer = new RiskAnalyzer();
  private technicalAnalyzer = new TechnicalAnalyzer();
  private recommendationAnalyzer = new RecommendationAnalyzer();

  analyzeRisk(userId: string) {
    const portfolio = storage.getPortfolioByUserId(userId);
    if (!portfolio) throw new Error("Portfolio not found");
    return this.riskAnalyzer.analyze(portfolio, userId);
  }

  analyzeTechnical(symbol: string) {
    return this.technicalAnalyzer.analyze(symbol);
  }

  generateRecommendations(userId: string) {
    return this.recommendationAnalyzer.generate(userId);
  }
}
