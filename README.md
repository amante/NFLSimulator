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
