# NFL Stats Uploader v1

Pequeña web estática para cargar y visualizar estadísticas de **equipos** y **jugadores** de la NFL desde archivos CSV.

## Cómo usar
1. Abre `index.html` en tu navegador.
2. Carga tu CSV de equipos y/o de jugadores (puedes usar las **plantillas** en la carpeta `samples/`).
3. Filtra con el buscador y haz clic en los encabezados para **ordenar**.
4. Puedes **descargar JSON** de lo que estés viendo o exportar un **snapshot HTML**.

## Formato esperado de CSV
- `samples/team_stats_template.csv`
```
Team,Att,Cmp,Cmp%,Yds/Att,PassYds,TD,INT,Rate,1st,1st%,20+,40+,Lng,Sck,SckY
```
- `samples/player_stats_template.csv`
```
Player,Team,Pos,GP,PassAtt,PassYds,PassTD,INT,RushAtt,RushYds,RushTD,Rec,RecYds,RecTD,Tackles,Sacks,DefINT,FantasyPts
```

> Puedes adaptar las columnas; la app detecta headers automáticamente.

## Sin dependencias externas
Incluye un parser CSV mínimo (`js/csv.js`) que soporta comillas y delimitador estándar (RFC4180 básico). No requiere internet.

## Próximos pasos (API)
Implementa en `js/app.js` la función `dataSource.fetchFromAPI()` con tu proveedor para traer datos y mapearlos a las columnas.

## Deploy rápido
- GitHub Pages: sube todo el contenido del zip a un repo `nfl-stats-uploader` y habilita Pages en la carpeta raíz.
- Cualquier hosting estático: sube todos los archivos y listo.

## URL de proyecto en GitHub Pages
- Dominio: `https://amante.github.io/NFLSimulator/`
- Este repo está preparado con `.nojekyll` y workflow `pages.yml`.

## Nueva vista: Viewer (nueva pestaña)
- Desde `index.html` haz clic en **Ver estadísticas (nueva pestaña)** para abrir `viewer.html`.
- La vista lee datos desde `localStorage` bajo el namespace `NFLSimulator`.
- Escucha cambios en vivo (evento `storage`) si cargas nuevos CSV en otra pestaña.

## v3: Perfiles y Gráficos (sin dependencias)
- **viewer.html**: haz clic en cualquier fila para abrir un **perfil** en `profile.html` (nueva pestaña).
- **charts.js**: gráficos de barras en **SVG** sin librerías externas.
- **profile.html**: vista detallada con métricas clave y gráfico.

## v3.1: Tabs superiores en Viewer
- La vista de estadísticas ahora tiene **tabs superiores**: _Equipos_ y _Jugadores_.

## v3.2: Tab Resumen por fecha (Partidos)
- Nuevo tab **Resumen** con selector de **fecha** (y navegación de día ±1).
- Muestra todos los partidos de ese día: hora, equipos, estado y marcador.
- Click en el nombre de un equipo abre su **perfil**.
- Carga datos de partidos desde `index.html` (uploader **Partidos**) y persiste en `localStorage`.
- Plantilla: `samples/games_template.csv`.

## v3.3: Filtros en Resumen + Export CSV
- Filtro por **Semana** y por **Equipo** en el tab Resumen.
- Botón **Exportar CSV** de la selección actual.

## v3.4: Badge de versión global
- Todas las páginas muestran **Versión v3.4** y la hora de compilación.
- El número de versión proviene de `js/version.js` (única fuente).

## v3.5: Tabs a nivel de sitio
- Nueva página `app.html` con tabs superiores: **Cargas** y **Ver estadísticas** (viewer embebido).
- `index.html` ahora redirige a `app.html` (se conserva `index_legacy.html`).
- Badge de versión se mantiene visible.

## v3.6: Equipos mejorado
- Selector de **métrica** y **Top N** en el tab Equipos.
- **KPIs** (conteo, promedio y suma de la métrica seleccionada).
- **Gráfico de barras** Top N por métrica.
- **Exportar CSV** del listado filtrado.

## v3.7: Stats Loader con secciones y subsecciones
- Nuevo **Stats Loader** con secciones: **Offense**, **Defense**, **Special Teams**.
- Sub-secciones según lo solicitado (19 en total), cada una con su uploader, búsqueda, descarga JSON y plantilla CSV.
- Los datos se guardan en `localStorage` por dataset (`NS:datasets:<area>:<sub>`).

## v3.8: Schedule integrado
- Renombrado tab de sitio **Ver estadísticas** → **Stats** y agregado tab **Schedule**.
- El tab **Schedule** muestra el calendario 2025 por **Semana** y **Equipo** (dataset embebido en `js/schedule.js`).
- El tab **Resumen** del viewer ahora usa el **Schedule** embebido en lugar de la carga de partidos.
- Se elimina la necesidad de cargar **Partidos** en Stats Loader.
- Puedes reemplazar el dataset con un JSON completo en `data/schedule_2025.json` y/o ajustar `js/schedule.js`.

## v3.9: Schedule completo (runtime)
- El tab **Schedule** ahora carga automáticamente **todas las semanas (1–18)** del **2025** desde endpoints públicos de ESPN en tiempo de ejecución y las cachea en `localStorage`.
- El **Resumen** del viewer usa el schedule cacheado si está disponible; si no, recurre al embedded sample.
- Se puede exportar el CSV filtrado por semana/equipo.
