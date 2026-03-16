# Histórico de Contexto - 2026-03-13

## Fecha: 13 de Marzo, 2026

---

## Componente Creado: Sistema de Agente IA

### Descripción
Se creó la estructura completa del sistema de agente IA para el proyecto Arkhe Aula, incluyendo:

1. **Carpeta AgenteIA/** - Contenedor principal de toda la documentación del agente
2. **archivo agente.md** - Documento principal con:
   - Información del proyecto (nombre, empresa, versión)
   - Idioma de comunicación (Español)
   - Rol del agente (Arquitecto de Software Senior y experto en BD)
   - Identidad visual (tipografía, colores, iconografía)
   - Stack tecnológico completo
   - Referencias a skills disponibles

3. **Skills creados en AgenteIA/skills/**:
   - `compilador.md` - Instrucciones de build y construcción
   - `frontend.md` - Convenciones y arquitectura del frontend
   - `basededatos.md` - Estructura y normalización de la BD
   - `instrucciones.md` - Cómo arrancar servidor e instalar dependencias
   - `pruebas.md` - Cómo correr tests en el proyecto

4. **Carpeta contexto/** - Para documentación de bugs y soluciones futuras

5. **Carpeta iconos/** - Para recursos de iconografía del sistema

### Decisiones de Diseño

#### Estructura de Carpetas
```
AgenteIA/
├── agente.md           # Documento principal
├── skills/             # Skills especializados
│   ├── compilador.md
│   ├── frontend.md
│   ├── basededatos.md
│   ├── instrucciones.md
│   └── pruebas.md
└── contexto/           # Memoria de contexto (bugs, soluciones)
```

#### Identidad Visual Definida
- **Tipografía Principal:** Sans Serif (headers, títulos)
- **Tipografía Secundaria:** Inter (cuerpo de texto)
- **Paleta de Colores:**
  - `#0D1B2A` - Primario (fondos oscuros)
  - `#1B9AAA` - Secundario (botones, enlaces)
  - `#E1A140` - Terciario (alertas, destacados)
  - `#E0E1DD` - Neutro (fondos claros)

#### Base de Datos
- **Motor:** SQLite con better-sqlite3 ^8.2.0
- **Tipo:** Embebida (local-first)
- **Normalización:** 3NF mínima requerida
- **Convenciones:** snake_case, plural para tablas

### Tecnologías Confirmadas

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Vue.js | ^3.5.0 |
| Build Tool | Vite | ^6.2.4 |
| Desktop | Electron | ^22.3.27 |
| Estado | Pinia | ^3.0.1 |
| Router | Vue Router | ^4.5.0 |
| BD | better-sqlite3 | ^8.2.0 |
| Lenguaje | TypeScript | ^5.8.2 |

### Comandos de Desarrollo
```bash
# Instalación
npm install

# Desarrollo
npm run dev

# Build
npm run build
npm run build:win
npm run build:mac
```

### Notas Importantes
1. La comunicación IA-programador es **exclusivamente en español**
2. Todos los iconos deben tomarse de la carpeta `iconos/`
3. Cada build debe consultar el skill `compilador.md`
4. El frontend se rige por `frontend.md`
5. La BD debe estar normalizada según `basededatos.md`
6. Todo bug/solución debe documentarse en `contexto/`

---

## Próximos Pasos Sugeridos

1. **Implementar testing:** Instalar Vitest y configurar según `pruebas.md`
2. **Documentar esquema actual:** Completar `basededatos.md` con el esquema real de la BD
3. **Agregar iconos:** Poblar carpeta `iconos/` con los recursos del sistema
4. **Configurar CI/CD:** Implementar pipeline de tests y builds automáticos
