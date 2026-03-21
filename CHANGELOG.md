# Changelog

## [Unreleased]
### Added
- Integración de NextAuth.js con Google Provider.
- Base de datos Turso con Drizzle ORM (esquema de usuarios y familias).
- Vistas de Dashboard público (vista de invitación y RSVP).
- Panel de Administración protegido para crear, editar y eliminar usuarios y familias.
- Soporte para variables de entorno para autenticación y base de datos local / de producción.
- Componentes base de UI y sistema de diseño visual aplicando la guía de estilo (`#f2eee8`, `#e7c6c1`, `#afc3b1`, etc.) y tipografías (Glacial Indifference y Tan Pearl).

### Changed
- Refactorización de componentes Tailwind con estilo visual "Romántico y Etéreo" (Glassmorphism, animaciones sutiles fade-in, colores pasteles).

### Fixed
- Corrección de errores de tipos TypeScript (`any`) y resolución de dependencias duplicadas.
- Fallback configurado en `db/index.ts` para evitar fallos de build en generación estática (Next.js).
