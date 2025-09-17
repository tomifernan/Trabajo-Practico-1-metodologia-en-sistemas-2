//servicios de trading
import { Transaction } from "../models/types";
import { storage } from "../utils/storage";
import { config } from "../config/config";

/**
 * Esta es la interfaz que define cómo debe funcionar cualquier estrategia de orden.
 * Básicamente, dice que debe tener un método 'execute' que haga la operación.
 */
export interface OrderStrategy {
  execute(
    userId: string,
    symbol: string,
    quantity: number
  ): Promise<Transaction>;
}

/**
 * Estrategia para cuando el usuario quiere comprar un activo.
 */
export class BuyOrderStrategy implements OrderStrategy {
  async execute(
    userId: string,
    symbol: string,
    quantity: number
  ): Promise<Transaction> {
    // Busco al usuario por su ID
    const user = storage.getUserById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    // Busco el activo que quiere comprar
    const asset = storage.getAssetBySymbol(symbol);
    if (!asset) throw new Error("Activo no encontrado");

    // Calculo el precio total de la compra
    const executionPrice = asset.currentPrice;
    const grossAmount = quantity * executionPrice;
    // Calculo las comisiones que se cobran por comprar
    const fees = this.calculateFees(grossAmount, "buy");
    // Sumo las comisiones al total
    const totalCost = grossAmount + fees;

    // Verifico si el usuario tiene suficiente dinero
    if (!user.canAfford(totalCost)) throw new Error("Fondos insuficientes");

    // Creo la transacción de compra
    const transaction = new Transaction(
      this.generateTransactionId(),
      userId,
      "buy",
      symbol,
      quantity,
      executionPrice,
      fees
    );

    // Marco la transacción como completada
    transaction.complete();
    // Le descuento el dinero al usuario
    user.deductBalance(totalCost);
    // Actualizo los datos del usuario
    storage.updateUser(user);

    // Actualizo el portafolio del usuario con el nuevo activo comprado
    const portfolio = storage.getPortfolioByUserId(userId);
    if (portfolio) {
      portfolio.addHolding(symbol, quantity, executionPrice);
      portfolio.calculateTotals();
      storage.updatePortfolio(portfolio);
    }

    // Guardo la transacción en el sistema
    storage.addTransaction(transaction);
    // Simulamos el mercado
    this.simulateMarketImpact(symbol, quantity, "buy");

    // Devuelvo la transacción para que se pueda usar después
    return transaction;
  }

  // Calculo las comisiones según el tipo de operación
  private calculateFees(amount: number, type: "buy" | "sell"): number {
    const feePercentage =
      type === "buy"
        ? config.tradingFees.buyFeePercentage
        : config.tradingFees.sellFeePercentage;
    return Math.max(amount * feePercentage, config.tradingFees.minimumFee);
  }

  // Simulo cómo cambia el precio del activo después de la compra
  private simulateMarketImpact(
    symbol: string,
    quantity: number,
    action: "buy" | "sell"
  ) {
    const marketData = storage.getMarketDataBySymbol(symbol);
    if (!marketData) return;

    // El impacto depende de cuánto se compra
    const impactFactor = quantity / 1_000_000;
    const priceImpact = marketData.price * impactFactor * 0.001;
    // Si es compra, el precio sube; si es venta, baja
    const newPrice =
      action === "buy"
        ? marketData.price + priceImpact
        : marketData.price - priceImpact;

    // Actualizo el precio en el mercado
    marketData.price = newPrice;
    marketData.timestamp = new Date();
    storage.updateMarketData(marketData);

    // También actualizo el precio del activo
    const asset = storage.getAssetBySymbol(symbol);
    if (asset) {
      asset.currentPrice = newPrice;
      asset.lastUpdated = new Date();
      storage.updateAsset(asset);
    }
  }

  // Genero un ID único para cada transacción
  private generateTransactionId(): string {
    return "txn_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }
}

/**
 * Estrategia para cuando el usuario quiere vender un activo.
 */
export class SellOrderStrategy implements OrderStrategy {
  async execute(
    userId: string,
    symbol: string,
    quantity: number
  ): Promise<Transaction> {
    // Busco al usuario
    const user = storage.getUserById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    // Busco el activo que quiere vender
    const asset = storage.getAssetBySymbol(symbol);
    if (!asset) throw new Error("Activo no encontrado");

    // Busco el portafolio del usuario
    const portfolio = storage.getPortfolioByUserId(userId);
    if (!portfolio) throw new Error("Portafolio no encontrado");

    // Verifico que el usuario tenga suficientes activos para vender
    const holding = portfolio.holdings.find((h) => h.symbol === symbol);
    if (!holding || holding.quantity < quantity) {
      throw new Error("No tienes suficientes activos para vender");
    }

    // Calculo el precio total de la venta
    const executionPrice = asset.currentPrice;
    const grossAmount = quantity * executionPrice;
    // Calculo las comisiones por vender
    const fees = this.calculateFees(grossAmount, "sell");
    // El usuario recibe el dinero menos las comisiones
    const netAmount = grossAmount - fees;

    // Creo la transacción de venta
    const transaction = new Transaction(
      this.generateTransactionId(),
      userId,
      "sell",
      symbol,
      quantity,
      executionPrice,
      fees
    );

    // Marco la transacción como completada
    transaction.complete();
    // Le sumo el dinero al usuario
    user.addBalance(netAmount);
    // Actualizo los datos del usuario
    storage.updateUser(user);

    // Quito los activos vendidos del portafolio
    portfolio.removeHolding(symbol, quantity);
    portfolio.calculateTotals();
    storage.updatePortfolio(portfolio);

    // Guardo la transacción
    storage.addTransaction(transaction);
    // Simulo el impacto en el mercado (el precio puede bajar)
    this.simulateMarketImpact(symbol, quantity, "sell");

    // Devuelvo la transacción
    return transaction;
  }

  // Calculo las comisiones igual que en la compra
  private calculateFees(amount: number, type: "buy" | "sell"): number {
    const feePercentage =
      type === "buy"
        ? config.tradingFees.buyFeePercentage
        : config.tradingFees.sellFeePercentage;
    return Math.max(amount * feePercentage, config.tradingFees.minimumFee);
  }

  // Simulo el impacto en el mercado igual que en la compra
  private simulateMarketImpact(
    symbol: string,
    quantity: number,
    action: "buy" | "sell"
  ) {
    const marketData = storage.getMarketDataBySymbol(symbol);
    if (!marketData) return;

    const impactFactor = quantity / 1_000_000;
    const priceImpact = marketData.price * impactFactor * 0.001;
    const newPrice =
      action === "buy"
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

  // Genero un ID único para la transacción
  private generateTransactionId(): string {
    return "txn_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }
}

/**
 * Esta clase es como una fábrica que te da la estrategia que necesitas según si vas a comprar o vender.
 * Si le pides "buy", te da la estrategia de compra; si le pides "sell", te da la de venta.
 */
export class TradingStrategyFactory {
  static create(type: "buy" | "sell"): OrderStrategy {
    if (type === "buy") return new BuyOrderStrategy();
    if (type === "sell") return new SellOrderStrategy();
    throw new Error("Tipo de orden no soportado");
  }
}
