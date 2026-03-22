# CHANGELOG: Redesign Admin Dashboard

## Tipo de Cambio
- UI/UX Update (Refactor / Feature)

## Cambios Realizados
1. **Nuevo Layout Administrativo:** Se ha sustituido la maqueta básica anterior por un Panel de Control estructurado y moderno que incluye:
   - `AdminSidebar.tsx`: Menú lateral colapsable (Desktop).
   - `AdminTopbar.tsx`: Barra superior unificada.
   - `BottomNav.tsx`: Navegación rápida inferior (Mobile).
2. **Dashboard de Métricas (Bento Grid):** Implementación de la vista principal del administrador en `src/app/admin/page.tsx`, con consultas a base de datos en tiempo real de Familias y Usuarios para renderizar las 4 tarjetas de estadísticas claves (Familias Totales, Usuarios Activos, Confirmados/Pendientes/Cancelados).
3. **Rediseño de Componentes Centrales:** Actualización de estilo exhaustiva en `FamilyForm`, `FamilyList`, `UserForm`, y `UserList` respetando el manual de marca (Colores: Crema, Sage, Oliva, Blush; Tipografías: Glacial Indifference).

## Justificación Técnica
- **Consistencia Visual:** Asegura que la experiencia del administrador refleje la misma estética "botánica y elegante" acordada para el frontend público de los novios, incrementando la legibilidad.
- **Aesthetic Glassmorphism:** Implementación de variables Tailwind precisas y efectos de desenfoque (`backdrop-blur-md`) que unifican el look-and-feel.
- **Eficiencia Operativa:** Mejor disposición de listas (UI en "cards") en lugar de iteraciones monótonas de lista para Familias y Usuarios, lo que previene clics fallidos, es Mobile First, y facilita la administración de grandes cantidades de registros para la boda.
