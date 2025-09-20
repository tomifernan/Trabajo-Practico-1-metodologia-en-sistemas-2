// Servicio de simulación de mercado refactorizado con Template Method
import { storage } from "../utils/storage";
import { config } from "../config/config";

/**
 * Clase base (Template Method) que define el flujo común
 * para actualizar precios de mercado y recalcular portfolios.
 */
abstract class MarketSimulationTemplate {
  updatePrices(): void {
    const allMarketData = storage.getAllMarketData();

    allMarketData.forEach((marketData) => {
      const newPrice = this.calculateNewPrice(marketData.price);
      const change = newPrice - marketData.price;
      const changePercent = (change / marketData.price) * 100;

      // Actualizar datos de mercado
      marketData.price = newPrice;
      marketData.change = change;
      marketData.changePercent = changePercent;
      marketData.timestamp = new Date();
      storage.updateMarketData(marketData);

      // Actualizar asset correspondiente
      const asset = storage.getAssetBySymbol(marketData.symbol);
      if (asset) {
        asset.currentPrice = newPrice;
        asset.lastUpdated = new Date();
        storage.updateAsset(asset);
      }
    });

    this.updateAllPortfolioValues();
  }

  // Método abstracto que define la variación de precio (cada subclase lo implementa)
  protected abstract calculateNewPrice(currentPrice: number): number;

  // Actualizar todos los portafolios (mismo código que ya tenías)
  private updateAllPortfolioValues(): void {
    const allUsers = [
      storage.getUserById("demo_user"),
      storage.getUserById("admin_user"),
      storage.getUserById("trader_user"),
    ].filter((user) => user !== undefined);

    allUsers.forEach((user) => {
      if (user) {
        const portfolio = storage.getPortfolioByUserId(user.id);
        if (portfolio && portfolio.holdings.length > 0) {
          this.recalculatePortfolioValues(portfolio);
          storage.updatePortfolio(portfolio);
        }
      }
    });
  }

  private recalculatePortfolioValues(portfolio: any): void {
    let totalValue = 0;
    let totalInvested = 0;

    portfolio.holdings.forEach((holding: any) => {
      const asset = storage.getAssetBySymbol(holding.symbol);
      if (asset) {
        holding.currentValue = holding.quantity * asset.currentPrice;
        const invested = holding.quantity * holding.averagePrice;
        holding.totalReturn = holding.currentValue - invested;
        holding.percentageReturn =
          invested > 0 ? (holding.totalReturn / invested) * 100 : 0;

        totalValue += holding.currentValue;
        totalInvested += invested;
      }
    });

    portfolio.totalValue = totalValue;
    portfolio.totalInvested = totalInvested;
    portfolio.totalReturn = totalValue - totalInvested;
    portfolio.percentageReturn =
      totalInvested > 0 ? (portfolio.totalReturn / totalInvested) * 100 : 0;
    portfolio.lastUpdated = new Date();
  }
}

/**
 * Estrategias concretas de simulación de mercado
 */
class RandomMarketSimulation extends MarketSimulationTemplate {
  protected calculateNewPrice(currentPrice: number): number {
    const randomChange = (Math.random() - 0.5) * 2; // -1 a +1
    const volatilityFactor = config.market.volatilityFactor;
    const priceChange = currentPrice * randomChange * volatilityFactor;
    return Math.max(currentPrice + priceChange, 0.01);
  }
}

class BullMarketSimulation extends MarketSimulationTemplate {
  protected calculateNewPrice(currentPrice: number): number {
    const impactFactor = 0.05 + Math.random() * 0.1; // +5% a +15%
    return Math.max(currentPrice * (1 + impactFactor), 0.01);
  }
}

class BearMarketSimulation extends MarketSimulationTemplate {
  protected calculateNewPrice(currentPrice: number): number {
    const impactFactor = -(0.05 + Math.random() * 0.1); // -5% a -15%
    return Math.max(currentPrice * (1 + impactFactor), 0.01);
  }
}

class CrashMarketSimulation extends MarketSimulationTemplate {
  protected calculateNewPrice(currentPrice: number): number {
    const impactFactor = -(0.15 + Math.random() * 0.2); // -15% a -35%
    return Math.max(currentPrice * (1 + impactFactor), 0.01);
  }
}

class RecoveryMarketSimulation extends MarketSimulationTemplate {
  protected calculateNewPrice(currentPrice: number): number {
    const impactFactor = 0.1 + Math.random() * 0.15; // +10% a +25%
    return Math.max(currentPrice * (1 + impactFactor), 0.01);
  }
}

/**
 * Servicio principal que usa las simulaciones
 */
export class MarketSimulationService {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private simulation: MarketSimulationTemplate | null = null;

  // Iniciar simulación normal (random)
  startMarketSimulation(): void {
    if (this.isRunning) {
      console.log("La simulación de mercado ya está ejecutándose");
      return;
    }

    this.isRunning = true;
    console.log("Iniciando simulación de mercado...");
    this.simulation = new RandomMarketSimulation();

    this.intervalId = setInterval(() => {
      this.simulation!.updatePrices();
    }, config.market.updateIntervalMs);
  }

  // Detener simulación
  stopMarketSimulation(): void {
    if (!this.isRunning) {
      console.log("La simulación de mercado no está ejecutándose");
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log("Simulación de mercado detenida");
  }

  // Simular un evento específico (bull, bear, crash, recovery)
  simulateMarketEvent(eventType: "bull" | "bear" | "crash" | "recovery"): void {
    console.log(`Simulando evento de mercado: ${eventType}`);

    switch (eventType) {
      case "bull":
        this.simulation = new BullMarketSimulation();
        break;
      case "bear":
        this.simulation = new BearMarketSimulation();
        break;
      case "crash":
        this.simulation = new CrashMarketSimulation();
        break;
      case "recovery":
        this.simulation = new RecoveryMarketSimulation();
        break;
    }

    this.simulation.updatePrices();
  }

  // Obtener estado de simulación
  getSimulationStatus(): { isRunning: boolean; lastUpdate: Date | null } {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.isRunning ? new Date() : null,
    };
  }
}
