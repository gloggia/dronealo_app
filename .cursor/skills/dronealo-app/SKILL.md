---
name: dronealo-app
description: >-
  Mantiene la demo cliente de Dronealo (HTML/CSS/JS): app móvil navegable, marca,
  paleta y estructura de layout. Incluye resumen del historial del proyecto. Usa cuando
  trabajás en Dronealo_app, maqueta estática, UI de cliente, barra inferior, solicitud
  o confirmación de pedidos.
---

# Dronealo — demo app cliente

## Resumen del historial (léelo primero al retomar el proyecto)

Lo que surgió en las conversaciones y **no conviene olvidar** cuando el usuario sigue preguntando:

| Tema | Qué quedó claro |
|------|------------------|
| **Intención** | Validar un **MVP** con maqueta, pero la **pantalla** debe parecer **app de cliente final**, no deck para inversores. |
| **Qué evitar en la UI** | Texto de “MVP”, pitch, marketplace vs operador, asignación manual, modelo de negocio interno, portal de pilotos en la app del cliente. |
| **Marca** | Nombre definitivo **Dronealo** (antes se dijo “DroneBy” en la idea). Pedidos de ejemplo con prefijo **`DA-`**. |
| **Stack** | Sitio **estático** (HTML/CSS/JS); no depender de npm si el entorno no lo tiene. |
| **Look & feel** | **App móvil** (marco ~430px en escritorio), modo claro, logo + paleta **#004AAD** / **#FF7012**, **Plus Jakarta Sans**, meta **`theme-color`** azul marca. |
| **Bug que ya mordió** | La **tab bar** se cortaba o solo se veían “Pedidos” y “Perfil” porque **`position: fixed`** vivía dentro de **`.app-root` con `overflow: hidden`**. Se corrigió con **`.app-shell`** (flex column), **tab bar hermana** de **`.app-root`**, scroll en el contenido y barra como última franja (sin depender de `fixed` dentro del área recortada). Evitar mezclar `left: 50%` + `translateX` con `right: 0` sin anular `right`. |

**Rol del asistente:** responder en **español**, como **asistente de producto** de Dronealo: útil para el usuario que “usa” la app, coherente con marca y layout; el contexto operador/plataforma queda para charla técnica o roadmap, **no** para copy visible en la demo.

---

## Contexto de producto (solo para desarrollo)

- Modelo tipo operador (Uber/Cabify): plataforma fija precios y asigna pilotos; cliente pide servicios de drones (fotografía, inspección, eventos, etc.).
- **Eso no va en la UI de la demo**: el usuario final no debe ver pitch, MVP, marketplace vs operador, asignación manual, inversores ni explicaciones de negocio internas.

## Qué debe sentir la demo

- **App de producto** lista para “usar”: Inicio, Servicios, Pedidos, Perfil, flujo de pedido en pasos y confirmación.
- Copy orientado al **uso** (reservas, seguimiento, ayuda), no a validar el modelo de negocio.

## Marca y datos ficticios

- Nombre de marca: **Dronealo** (no DroneBy ni otros).
- Códigos de pedido de ejemplo: prefijo **`DA-`**.
- Perfil / versión puede decir algo tipo “Dronealo v1.0 · Argentina” si encaja con el resto.

## Diseño (respetar o extender desde `css/main.css`)

Variables típicas en `:root`:

| Uso | Color |
|-----|--------|
| Azul marca | `#004AAD` |
| Naranja (CTA, acentos) | `#FF7012` |
| Texto | `#142132` · secundario `#5c6b80` |
| Superficies | `#fff`, `#f7f9fc`, fondo degradado claro |

- Fuente: **Plus Jakarta Sans** (Google Fonts o equivalente ya enlazado).
- `theme-color` meta: `#004AAD` para barra del navegador en móvil.
- Logo: isotipo en `assets/logo-isotipo.png`; wordmark puede ser **DRONE** + **ALO** con colores de marca. Si existe `assets/logo-horizontal.png`, se puede usar en home.

## Estructura de archivos esperada

- `index.html`, `servicios.html`, `pedidos.html`, `perfil.html`, `solicitar.html`, `confirmacion.html`
- `css/main.css`, `js/solicitar.js`
- No añadir páginas tipo “pitch” o portal de pilotos en la demo del **cliente**.

## Layout móvil — reglas que evitan bugs en la barra inferior

1. Contenedor exterior **`.app-shell`** (ancho máx. ~430px en escritorio): envuelve todo el “teléfono”.
2. **`.app-root`**: cabecera + área scroll; usar **`overflow-y: auto`**, no `overflow: hidden` en el contenedor que corte hijos “fixed” de forma rara.
3. **`<nav class="tab-bar">`**: **hermano** de `.app-root`, **no** hijo dentro de un bloque con `overflow: hidden` que recorte `position: fixed`.
4. Preferir la barra como **última franja de un flex column** en `.app-shell` en lugar de depender de `position: fixed` dentro de ancestros con `transform` u `overflow` problemáticos.
5. Enlaces del tab: repartir ancho (`flex: 1 1 0`, `min-width: 0`) para que se vean **las cuatro** pestañas: Inicio · Servicios · Pedidos · Perfil.

## Al cambiar estilos

- Probar en viewport estrecho y ancho; la barra debe coincidir con el ancho del marco blanco y mostrar **cuatro** ítems.
- Evitar combinar `left: 50%` + `translateX` en la barra con `right: 0` sin anular `right` en el mismo breakpoint.

## Idioma

- Textos de interfaz para el usuario en **español** (Argentina si el copy lo requiere).
