//src/services/TradingService.ts
import { Transaction } from "../models/types";
import { TradingStrategyFactory } from "./TradingStrategyFactory";
import { storage } from "../utils/storage";

// Esta clase es como el "centro de operaciones" para las órdenes de trading
export class TradingService {
  // Este método se usa para ejecutar una orden, ya sea de compra o venta
  async executeOrder(
    type: "buy" | "sell",
    userId: string,
    symbol: string,
    quantity: number
  ): Promise<Transaction> {
    // Según el tipo de orden, pido la estrategia adecuada (compra o venta)
    const strategy = TradingStrategyFactory.create(type);
    // Ejecuto la orden usando la estrategia elegida
    return strategy.execute(userId, symbol, quantity);
  }

  // Este método te da el historial de transacciones de un usuario
  getTransactionHistory(userId: string): Transaction[] {
    // Busco todas las transacciones que hizo el usuario
    return storage.getTransactionsByUserId(userId);
  }
}
