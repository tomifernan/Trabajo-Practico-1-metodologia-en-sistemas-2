# Trabajo Práctico 1

## Problemas detectados en el código original TradingService.ts

Metodos con duplicacion de logica
Clases con multiples tareas (violacion de SRP)
Codigo dificil de extender (violacion de OCP)

En el archivo `TradingService.ts` implemente los siguientes patrones de diseño (Strategy + Factory)

- Strategy lo que hace es que elimino la necesidad de condicionales y centralizo la logica en clases.
- Factory lo que hace es que `TradingService.ts` se encargue de las creaciones de estrategias y delega esa responsabilidad.

Problemas detectados en `TradingService.ts` es que ExecuteBuy order y ExecuteSellOrder duplicaban codigo.

Solucion :

- Cree OrderStrategy.
- Implemente estrategias concretas como BuyOrderStrategy, SellOrderStrategy.
- TradingService manda la ejecucion a una estrategia seleccionada a travez de Factory.

Beneficios de la implementacion de estos patrones de diseño en `TradingService.ts` seria que cumple con SRP y OCP que al principio del codigo eso no cumplia y
ademas podemos agregar un tipo de orden y no necesitamos modificar `TradingService.ts`.

## Problemas detectados en el código original MarketSimulationService

La logica de simulacion estaba en un solo metodo (updateMarketPrices)

En el archivo `MarketSimulationService` implemente los siguientes patrones de diseño (Template)

- cree una clase base llamada MarketSimulationTemplate que define el cuerpo de la simulacion.
- cree subclases (RandomMarketSimulation , BullMarketSimulation, BearMarketSimulation) implementan la logica especifica de actualizacion de precios.

Justificacion del uso de Template:

- Permite reutilizar los pasos comunes de simulacionn y solo variar el calculo de precios.
- Facilita la creacion de nuevas simulaciones sin tocar el codigo base-

Beneficios: Es que reutilizamos codigo , Cumplimos OCP y ademas tiene mas claridad el codigo.

## Problemas detectados en el código original MarketAnalysisService

Problemas encontrados: La clase tenia muchas responsabilidades como analisis de riesgo , analisis tecnico y recomendaciones. Ademas codigo demasiado largo y dificil de enteder.

Patron aplicado (Facade)
Dividi enn subsistemas:
RiskAnalyzer (riesgo)
TechnicalAnalyzer (análisis técnico)
RecommendationAnalyzer (recomendaciones)
MarketAnalysisService actúa como fachada, exponiendo solo métodos simples (analyzeRisk, analyzeTechnical, generateRecommendations).

Justificacion del uso de Facade:

- El patrón Facade oculta la complejidad interna y ofrece una interfaz simple para el controlador.
- Favorece la separación de responsabilidades.

Ventajas obtenidas : Cumple SRP (cada clase se encarga de algo en concreto), Simplicidad de uso y tiene escabilidad lo que quiere decir es que es mucho mas facil agregar nuevos subsistemas sin modificar el original.

Diagramas de antes y despues de aplicar patrones de diseño:

## TradingService

### Antes

![TradingService Antes](</src/images/TradingService%20(antes)+.png>)

### Después (con Strategy + Factory)

![TradingService Después](</src/images/TradingService%20(despues).png>)

## MarketSimulationService

### Antes

![MarketSimulation Antes](</src/images/MarketSimulationService(antes).png>)

### Después (con Template Method)

![MarketSimulation Después](</src/images/MarketSimulationService(despues).png>)

## MarketAnalysisService

### Antes

![MarketAnalysis Antes](</src/images/marketanlysis(antes).png>)

### Después (con Facade)

![MarketAnalysis Después](</src/images/marketanlysis(despues).png>)
