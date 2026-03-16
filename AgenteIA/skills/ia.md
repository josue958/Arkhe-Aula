# Skill: IA

## Propósito

Este skill describe la integración de modelos de Inteligencia Artificial en el ecosistema de **Arkhe Aula**, específicamente para el asistente de autoría pedagógica y la generación de planeaciones.

## Modelos Soportados

El sistema Arkhe Aula es agnóstico al modelo, pero se priorizan los siguientes por su relación calidad/precio y capacidades:

### 1. Qwen (Alibaba Cloud) - RECOMENDADO
- **Modelo:** `qwen-plus`, `qwen-max`, `qwen-turbo`
- **Uso:** Generación masiva de PDAs y planeaciones pedagógicas.
- **Ventaja:** Excelente manejo de estructuras JSON y bajo costo.

### 2. Antigravity (Google DeepMind)
- **Modelo:** Modelos internos de desarrollo agentic.
- **Uso:** Tareas de codificación avanzada, mantenimiento del sistema y razonamiento complejo.
- **Ventaja:** Integración nativa con el flujo de trabajo del AgenteIA.

### 3. Claude (Anthropic)
- **Modelo:** `claude-3-5-sonnet-latest`
- **Uso:** Refinamiento de lenguaje natural y creatividad pedagógica.

## Configuración de Modelos

Para agregar o cambiar modelos en el sistema de IA:

1.  **Directorio:** `/src/services/ai/`
2.  **Archivo de Configuración:** `ai-config.json`
3.  **Proveedores:**
    ```json
    {
      "providers": {
        "qwen": {
          "apiKey": "TU_API_KEY",
          "baseUrl": "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
          "defaultModel": "qwen-plus"
        },
        "antigravity": {
          "provider": "google",
          "apiKey": "TU_API_KEY_GOOGLE",
          "defaultModel": "gemini-3-pro"
        }
      }
    }
    ```

## Flujo de Trabajo del AgenteIA

El **AgenteIA** (Antigravity) es responsable de:
1.  **Mantener el Core:** Asegurar que los endpoints de IA en Electron funcionen.
2.  **Validar Prompts:** Mantener la biblioteca de prompts pedagógicos en `/src/assets/prompts/`.
3.  **Optimización:** Monitorear el consumo de tokens y sugerir cambios de modelo según la tarea.

## Integración en Arkhe Aula Web

Para el sitio **Arkhe Aula Web**, la integración de IA se maneja vía **Serverless Functions** (Edge Functions en Supabase o Vercel) para proteger las API Keys:

1.  El cliente solicita una planeación.
2.  La función de backend recibe los parámetros (Grado, Materia, PDA).
3.  La función llama al modelo configurado (ej: Qwen).
4.  Retorna el resultado estructurado al sitio web.

---

> [!TIP]
> **Prioridad de Modelos:** Para tareas de bajo razonamiento usa `qwen-turbo`. Para creación de contenidos complejos usa `qwen-max` o `claude-3-5-sonnet`.
