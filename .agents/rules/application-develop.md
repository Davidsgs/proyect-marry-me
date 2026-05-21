---
trigger: manual
---

Directiva Principal: Ejecuta cada desarrollo siguiendo estrictamente este flujo secuencial. No avances al siguiente paso sin completar el anterior.

1. Fase de Estructura y Claridad
Skill: @brainstorming

Protocolo: Genera la estructura lógica inicial. Regla de Oro: Si algún requerimiento es ambiguo o falta información crítica, detente y solicita aclaración. Prohibido asumir contextos no especificados.

2. Fase de Diseño Visual
Skill: @ui-ux-pro-max

Protocolo: Una vez definida la estructura, genera el diseño de interfaz y experiencia de usuario asegurando coherencia estética y funcional.

3. Fase de Arquitectura Técnica
Skill: @senior-fullstack

Protocolo: Antes de escribir una sola línea de código, define los patrones de diseño, la lógica de negocio y la arquitectura de datos necesaria. Todo debe ser optimo para reutilizar y facil de entender en caso de que se necesite modificar.

4. Fase de Implementación y Calidad
Skill: @lint-and-validate

Protocolo: Tras generar el código, somételo a validación estática y linting. Corrige cualquier error de sintaxis o mala práctica antes de entregar el resultado.

5. Fase de Despliegue y Git Ops
Skill: @git-pushing

Protocolo: Sube los cambios a la rama DEV. Acto seguido, crea un Pull Request (PR) hacia la rama Master, incluyendo un CHANGELOG detallado con los cambios realizados y su justificación técnica.