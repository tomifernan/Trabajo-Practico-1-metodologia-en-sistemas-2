# Trabajo Práctico 1

## Problemas detectados en el código original

En el archivo `TradingService.ts` se encontraron los siguientes problemas de diseño:

- **Duplicación de código**: Los métodos `executeBuyOrder` y `executeSellOrder` repetían gran parte de la lógica, violando el principio DRY.
- **Violación del principio SRP (Single Responsibility Principle)**: La clase `TradingService` se encargaba de demasiadas tareas (validaciones, lógica de negocio, actualización de balances y portafolio).
- **Violación del principio OCP (Open/Closed Principle)**: Si se quería agregar un nuevo tipo de orden, era necesario modificar `TradingService`, lo que generaba alto acoplamiento y baja extensibilidad.

---

## Refactorización aplicada

- Se aplicaron los patrones **Strategy** y **Factory**:
  - `TradingService.ts` ya no contiene lógica de compra y venta; su única responsabilidad es **delegar a la estrategia correcta**.
  - Cada estrategia (`BuyOrderStrategy`, `SellOrderStrategy`) encapsula la lógica de un tipo de orden específico.
  - El **Factory** centraliza la creación de estrategias, devolviendo la adecuada según el tipo de operación (`buy` o `sell`).

---

## Justificación de los patrones utilizados

- **Por qué Strategy**  
  El patrón **Strategy** permite encapsular distintos comportamientos (comprar, vender, o futuros tipos de órdenes como `LimitOrder` o `StopLossOrder`) dentro de clases independientes que comparten una interfaz común.  
  Esto elimina la necesidad de condicionales (`if/else`) dentro de `TradingService`, mejora la legibilidad y facilita extender el sistema sin romper el código existente.

- **Por qué Factory**  
  El patrón **Factory** complementa a Strategy creando la estrategia correcta de manera centralizada.  
  De esta forma, `TradingService` no necesita saber cómo instanciar cada estrategia: solo pide una orden de tipo `"buy"` o `"sell"` y la Factory se encarga de devolver la clase correspondiente.  
  Esto desacopla la lógica de creación de objetos y asegura que el código cumpla con **OCP**, ya que agregar una nueva orden no requiere modificar `TradingService`.

---

## Ventajas obtenidas

- **Cumplimiento de SRP**: Cada clase tiene ahora una sola responsabilidad (TradingService delega, las estrategias ejecutan).
- **Cumplimiento de OCP**: Para agregar nuevas órdenes no es necesario modificar `TradingService`; basta con crear una nueva clase que implemente `OrderStrategy` y registrarla en la Factory.
- **Código más limpio y mantenible**, evitando duplicación y facilitando la extensión del sistema.
- **Escalabilidad**: El sistema queda preparado para soportar nuevos tipos de órdenes o reglas de negocio sin alterar el código existente.

## Problemas detectados en el código original

En el archivo `MarketSimulationService.ts` se encontraron los siguientes problemas de diseño:
Logica de negocio acoplado: El metodo updateMarketPrices contenia una logica de actualizacion de precios fija y no era facilmente adaptable para diferentes escenarios de mercado (alcista, bajista, etc.). La lógica para simular eventos de mercado se encontraba en un método separado, lo que dificultaba su integración en el bucle de simulación principal.

## Refactorizacion aplicada

Se aplicó el patrón Template Method:

Se creó una clase base abstracta (MarketSimulationTemplate) que define el esqueleto del algoritmo para actualizar los precios del mercado.

Los pasos fijos del algoritmo (obtener datos, iterar sobre activos, actualizar portafolios) se implementaron en esta clase base.

El paso variable, calculateNewPrice, se definió como un método abstracto que cada subclase concreta debe implementar.

Se crearon subclases concretas (RandomMarketSimulation, BullMarketSimulation, BearMarketSimulation, etc.) que implementan la lógica específica para el cálculo de precios en cada escenario.

## Justificación de los patrones utilizados

Por qué Template Method
El patrón Template Method nos permitió definir la estructura del proceso de simulación en una sola clase, mientras que la variación de los precios se delegó a las subclases. Esto evita la repetición de código para los pasos comunes y facilita la creación de nuevos tipos de simulaciones de mercado sin alterar la estructura principal. Ahora, el MarketSimulationService simplemente delega la ejecución al objeto de simulación (la estrategia) adecuado, lo que lo hace más flexible y extensible.

## Ventajas obtenidas

Reutilización de código: La lógica común de actualización de mercado y portafolios se centraliza en la clase base, evitando la duplicación.
Cumplimiento de OCP: Agregar un nuevo tipo de simulación (por ejemplo, una "fase de estancamiento") solo requiere crear una nueva subclase que implemente el método abstracto calculateNewPrice, sin modificar el código existente.
Flexibilidad y mantenibilidad: La lógica para cada escenario de mercado está claramente separada en su propia clase, lo que hace el código más fácil de entender y mantener.
