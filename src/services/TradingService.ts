import { Transaction, Portfolio } from "../models/types";
import { storage } from "../utils/storage";
import { config } from "../config/config";

/* ==== Estrategia base ==== */
interface OrderStrategy {
  execute(userId: string, symbol: string, quantity: number): Promise<Transaction>;
}

/* ==== Estrategia de compra ==== */
class BuyOrderStrategy implements OrderStrategy {
  async execute(userId: string, symbol: string, quantity: number): Promise<Transaction> {
    const user = storage.getUserById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    const asset = storage.getAssetBySymbol(symbol);
    if (!asset) throw new Error("Activo no encontrado");

    const executionPrice = asset.currentPrice;
    const grossAmount = quantity * executionPrice;
    const fees = this.calculateFees(grossAmount);
    const totalCost = grossAmount + fees;

    if (!user.canAfford(totalCost)) throw new Error("Fondos insuficientes");

    const transactionId = this.generateTransactionId();
    const transaction = new Transaction(
      transactionId,
      userId,
      "buy",
      symbol,
      quantity,
      executionPrice,
      fees
    );

    transaction.complete();

    user.deductBalance(totalCost);
    storage.updateUser(user);

    const portfolio = storage.getPortfolioByUserId(userId);
    if (portfolio) {
      portfolio.addHolding(symbol, quantity, executionPrice);
      portfolio.calculateTotals();
      storage.updatePortfolio(portfolio);
    }

    storage.addTransaction(transaction);
    this.simulateMarketImpact(symbol, quantity, "buy");

    return transaction;
  }

  private calculateFees(amount: number): number {
    const fee = amount * config.tradingFees.buyFeePercentage;
    return Math.max(fee, config.tradingFees.minimumFee);
  }

  private generateTransactionId(): string {
    return "txn_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  private simulateMarketImpact(symbol: string, quantity: number, action: "buy" | "sell") {
    const marketData = storage.getMarketDataBySymbol(symbol);
    if (!marketData) return;

    const impactFactor = quantity / 1000000;
    const priceImpact = marketData.price * impactFactor * 0.001;

    const newPrice = action === "buy"
      ? marketData.price + priceImpact
      : marketData.price - priceImpact;

    marketData.price = newPrice;
    marketData.timestamp = new Date();
    storage.updateMarketData(marketData);

    const asset = storage.getAssetBySymbol(symbol);
    if (asset) {
      asset.currentPrice = newPrice;
      asset.lastUpdated = new Date();
      storage.updateAsset(asset);
    }
  }
}

/* ==== Estrategia de venta ==== */
class SellOrderStrategy implements OrderStrategy {
  async execute(userId: string, symbol: string, quantity: number): Promise<Transaction> {
    const user = storage.getUserById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    const asset = storage.getAssetBySymbol(symbol);
    if (!asset) throw new Error("Activo no encontrado");

    const portfolio = storage.getPortfolioByUserId(userId);
    if (!portfolio) throw new Error("Portafolio no encontrado");

    const holding = portfolio.holdings.find((h) => h.symbol === symbol);
    if (!holding || holding.quantity < quantity) throw new Error("No tienes suficientes activos para vender");

    const executionPrice = asset.currentPrice;
    const grossAmount = quantity * executionPrice;
    const fees = this.calculateFees(grossAmount);
    const netAmount = grossAmount - fees;

    const transactionId = this.generateTransactionId();
    const transaction = new Transaction(
      transactionId,
      userId,
      "sell",
      symbol,
      quantity,
      executionPrice,
      fees
    );

    transaction.complete();

    user.addBalance(netAmount);
    storage.updateUser(user);

    portfolio.removeHolding(symbol, quantity);
    portfolio.calculateTotals();
    storage.updatePortfolio(portfolio);

    storage.addTransaction(transaction);
    this.simulateMarketImpact(symbol, quantity, "sell");

    return transaction;
  }

  private calculateFees(amount: number): number {
    const fee = amount * config.tradingFees.sellFeePercentage;
    return Math.max(fee, config.tradingFees.minimumFee);
  }

  private generateTransactionId(): string {
    return "txn_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  private simulateMarketImpact(symbol: string, quantity: number, action: "buy" | "sell") {
    const marketData = storage.getMarketDataBySymbol(symbol);
    if (!marketData) return;

    const impactFactor = quantity / 1000000;
    const priceImpact = marketData.price * impactFactor * 0.001;

    const newPrice = action === "buy"
      ? marketData.price + priceImpact
      : marketData.price - priceImpact;

    marketData.price = newPrice;
    marketData.timestamp = new Date();
    storage.updateMarketData(marketData);

    const asset = storage.getAssetBySymbol(symbol);
    if (asset) {
      asset.currentPrice = newPrice;
      asset.lastUpdated = new Date();
      storage.updateAsset(asset);
    }
  }
}

/* ==== Factory ==== */
class TradingStrategyFactory {
  static getStrategy(type: "buy" | "sell"): OrderStrategy {
    if (type === "buy") return new BuyOrderStrategy();
    if (type === "sell") return new SellOrderStrategy();
    throw new Error("Tipo de orden no soportado");
  }
}

/* ==== TradingService principal ==== */
export class TradingService {
  async executeOrder(
    type: "buy" | "sell",
    userId: string,
    symbol: string,
    quantity: number,
  ): Promise<Transaction> {
    const strategy = TradingStrategyFactory.getStrategy(type);
    return strategy.execute(userId, symbol, quantity);
  }

  getTransactionHistory(userId: string): Transaction[] {
    return storage.getTransactionsByUserId(userId);
  }
}

