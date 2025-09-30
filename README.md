# NFL Win Probabilities — v2

Mejoras sobre v1:
- **Normalización** selectable: Z-score, percentil o sin normalizar.
- **Pesos por métrica ampliados** (EPA/DVOA/SOS, etc.).
- **Factores contextuales** en el simulador: localía, clima (°C), descanso y lesiones.
- **Exportar/Importar** estado completo (equipos/pesos/meta).

## Uso
1. Abrir `index.html` (no requiere servidor).
2. Cargar un CSV o usar **Cargar ejemplo**.
3. Ajustar normalización, pesos y factores.
4. Elegir equipos y **Calcular**.

## CSV soportado
Cualquier columna adicional se conserva. Recomendado:
```
team,off_rating,def_rating,special_rating,epa_off,epa_def,dvoa_off,dvoa_def,sos,rest_days,injuries,temp_c,home
Kansas City Chiefs,92,85,78,0.22,-0.12,18.5,-12.3,1.2,6,1.0,18,1
...
```

## Cálculo
- **Power** = `intercept` + Σ( peso_k * normalizar(métrica_k) * signo_k )  
  - `signo_k` = -1 para métricas donde menor es mejor (p.ej. `epa_def`, `dvoa_def`).
- **Prob(A)** = logística( `k * (PowerA - PowerB)` ).
- Ajustes: `+home_adv` si local, `-temp_weight * Δ` para el menos adaptado, `+/- rest_weight * días`, `- injury_weight * diff`.

## Roadmap v3
- Calibración con históricos (Brier/LogLoss) y guardado de curvas.
- Pesos automáticos vía regresión/AutoTune.
- Segmentos por superficie/clima/rivalidad/viaje.
- Gráficos de distribución y sensibilidad de pesos.
