# Rentabilidad - Casa de Nadie

Dashboard web de rentabilidad y food cost para Casa de Nadie. Un solo archivo
'index.html' con HTML + CSS + JavaScript vanilla: sin build, sin framework, sin npm.

## Como funciona

No hay backend ni base de datos. El dashboard lee un Google Sheet publicado,
exportado como XLSX, y se re-sincroniza cada 60 segundos sin recargar la pagina.

- Fuente: hoja de calculo "Formato de Informes Casa de Nadie" (export?format=xlsx)
- Deteccion de cambios: hash FNV-1a con muestreo cada 521 bytes; solo re-renderiza si el archivo cambio
- Fallback: si se abre como archivo local o falla el fetch, aparece un selector para cargar el Excel a mano

El Sheet debe estar compartido como "Cualquiera con el enlace: Lector".

## Hojas que consume

| Hoja | Uso |
|---|---|
| VENTAS | ventas base y neta, unidades, rankings por articulo y familia, clasificacion Cocina/Bar |
| COMPRAS | compras netas por proveedor, familia, articulo, mes y centro de costos |
| INVENTARIOS | valor inventariado por conteo. Cada fecha de documento es un conteo: el primero del periodo es el Inventario Inicial y el segundo el Inventario Final |

| RENTABILIDAD | ficha tecnica por articulo (Precio, Impuesto, Base, Coste, Margen). Es la UNICA fuente del costo de cada plato |

El encabezado de cada hoja se detecta solo (no tiene que estar en la fila 1) y las
columnas se buscan por palabras clave, asi que renombrarlas no rompe el tablero.

## Pestanas

Resumen, Ventas, Compras, Costo, Rentabilidad, Participacion, Inventarios y
Mercancia Vendida (juego de inventarios con exportacion a Excel).

Hay una sola marca y una sola sede, asi que el tablero no compara sedes: no existe
filtro de sede ni graficos por sede. El analisis se abre por Centro de Costo
(Bar / Cocina) con un filtro de Todos / Bar / Cocina.

Un boton en el encabezado alterna entre modo claro y modo oscuro. La preferencia se
guarda en el navegador y se conserva al navegar entre pestanas.

### Rentabilidad

Es el informe de desempeno del menu. Consolida ventas, costos y rentabilidad del
mismo periodo filtrado:

- Diez indicadores globales: venta base, costo de fichas, utilidad bruta, margen bruto,
  costo sobre venta, productos por encima del 35%, unidades vendidas, numero de facturas,
  ticket promedio y costo promedio por plato. Cada tarjeta muestra el valor resumido en
  millones y, debajo, el valor exacto en pesos.
- Rankings: mejor margen, mas vendidos por unidades, mayor utilidad total y bajo margen.
- Productos que los meseros deben ofrecer primero: puntaje automatico que pesa
  margen 40%, rotacion 30% y utilidad 30%.
- Ingenieria del Menu: tabla producto por producto con Centro de Costo, Producto,
  Familia, Unidades vendidas, Participacion de esas unidades, Venta Base, Costo,
  Costo %, Utilidad y Margen. Sin clasificaciones tipo Estrella / Caballo de batalla /
  Rompecabezas / Perro: se eliminaron por pedido del negocio.
- Graficos: top 10 mayor utilidad, top 10 mas vendidos, top 10 mejor margen,
  productos con costo por encima del 35%, ventas por familia, costos por familia,
  participacion por centro de costo y tendencia mensual de venta, costo y margen.
- La hoja RENTABILIDAD se muestra ademas tal cual viene de Drive, para poder auditar
  de donde sale cada coste.

De donde sale el costo de cada plato:

Del campo Coste de la hoja RENTABILIDAD de Google Drive, y de ningun otro lado.
Costo del producto = coste de la ficha x unidades vendidas.

No se deduce desde las ventas a proposito: un plato es un producto compuesto y una
venta solo dice cuantas unidades salieron, no que insumos ni que cantidades lleva la
receta. Si un producto vendido no tiene ficha en la hoja RENTABILIDAD aparece en la
tabla con sus unidades y su venta base, pero se deja fuera del costo, la utilidad, el
margen y los rankings, y la nota superior dice cuantos son.

Alerta de costo:

La meta de food cost es 35% como maximo. Todo producto cuyo Costo % supere ese limite
se marca en rojo con un aviso en la tabla, tiene su propio grafico y su propia tarjeta
de indicador, y se puede aislar con el boton "Solo costo > 35%". Sirve para detectar
que platos necesitan revision de precio o de receta.

## Notas de calculo

- El parser es tolerante a los nombres de columna: busca por palabras clave, no por posicion exacta.
- Los numeros se leen en formato es-CO (punto de mil, coma decimal, simbolo de moneda).
- Fuente unica de verdad: la funcion calc() del index.html. Ningun modulo recalcula
  por su cuenta; todos leen el mismo motor, por eso los numeros cuadran entre pestanas.
- Ventas = suma de la columna Base de VENTAS (Base Neta: sin IVA, sin propinas).
  Se incluyen notas credito y descuentos (valores negativos) para cuadrar con el reporte.
- Todos los indicadores respetan a la vez el filtro de Mes y Centro de Costo.
  El filtro de centro ofrece Todos / Bar / Cocina; las ventas de Eventos se reparten
  entre Bar y Cocina segun el articulo, para que nada quede fuera del analisis.
- Mercancia Vendida = Inventario Inicial + Compras - Inventario Final.
  Excel equivalente: =+[@[Inv Inicial]]+[@Compras]-([@[Inv Final]])
- Costo Mercancia Vendida (%) = Mercancia Vendida / Ventas.
  Excel equivalente: =+[@[Mercancia vendida]]/[@[Ventas]]
- Inventario Inicial = primer conteo del periodo seleccionado.
  Inventario Final = segundo (ultimo) conteo del periodo seleccionado.
- Utilidad Bruta = Ventas Base Neta - Mercancia Vendida. Su % se calcula sobre las ventas.
- Con un solo conteo en el periodo el juego de inventarios no es aplicable: la mercancia
  vendida cae a las compras del periodo y el dashboard lo indica de forma explicita.
- Compras del juego de inventarios: solo se toman las compras cuyo Centro de Costo es
  Bar o Cocina. Todo lo demas (aseo, papeleria, utensilios, etc.) queda fuera del calculo
  y se muestra aparte en la pestana Compras para que el descarte sea auditable.
- Todas las tarjetas del Resumen muestran el valor resumido en millones y, debajo,
  el valor exacto en pesos.
- La pestana Rentabilidad toma el costo de cada plato de la hoja RENTABILIDAD tal como
  esta, y las unidades y la Venta Base de la hoja VENTAS. Descarta las tarifas de Rappi,
  personal y empleados, y las familias que no son producto real (adiciones, cortesias,
  descuentos, propinas, etc.).
- Utilidad = Venta Base - Costo. Margen = Utilidad / Venta Base. Costo % = Costo / Venta Base.
  Todo se calcula sobre la Venta Base, nunca sobre ventas con impuestos.
- Mercancia Vendida por Sede y Costo de Mercancia Vendida por Sede ya no existen.
  Quedan Mercancia Vendida por Centro de Costo y Costo de Mercancia Global.
- Los graficos de una pestana oculta se redimensionan al mostrarla, para que las barras
  y sus etiquetas queden alineadas.

## Rendimiento

Con el volumen real (unas 14.000 filas de ventas, 5.000 de compras y 2.500 de fichas)
las medidas en el navegador son:

- Cambiar de mes, sede o centro de costos: alrededor de 0,15 s.
- Abrir una pestana por primera vez despues de un cambio de filtro: 0,3 a 0,6 s.
- Volver a una pestana ya dibujada: instantaneo.

Dos decisiones explican esos numeros:

1. Solo se dibuja la pestana visible. Un cambio de filtro marca las otras ocho y cada una
   se dibuja cuando se abre, no antes. Antes se redibujaban las nueve de golpe (unos 2 s).
2. Las tablas largas (la hoja RENTABILIDAD completa y la Ingenieria del Menu producto por
   producto) se pintan en tramos de 250 filas, con un boton para ir mostrando mas.

Lo que queda es el tiempo de la libreria XLSX al leer el archivo, que es proporcional al
tamano del Excel y ocurre una sola vez por sincronizacion.
- Meta de food cost: 35% como maximo.
- El tema claro/oscuro solo cambia la apariencia: no altera ningun calculo.

## Despliegue

Sitio estatico sin build. 'vercel.json' desactiva cualquier paso de compilacion.
