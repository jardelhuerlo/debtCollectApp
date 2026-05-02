# TODO - PayTrack (DebtCollectApp)

## Prioridad: Alta

### 1. Centralizar Estilos ✅ COMPLETADO

- [x] Migrar todos los inline styles a `StyleSheet.create()`
- [x] Crear archivo base de estilos reutilizables (inputs, botones, cards, textos)
- [x] Eliminar duplicación de colores, bordes, paddings
- [x] Implementar Dark Mode consistente en todas las pantallas

### 2. Custom Hooks para Lógica Repetitiva ✅ COMPLETADO

- [x] Crear `useAuth` - manejo de sesión, login, logout, estado de autenticación
- [x] Crear `useProfile` - fetch y actualización de perfil
- [x] Crear `useLoans` - CRUD de préstamos
- [x] Extraer lógica de Supabase de las pantallas a servicios

### 3. Gestión de Estado (React Query / TanStack Query) ✅ COMPLETADO

- [x] Reemplazar `useEffect` + `useState` para data fetching
- [x] Configurar queryClient con stale times apropiados
- [x] Implementar caching de perfil y préstamos
- [x] Agregar loading states y error boundaries globales
- [x] Optimistic updates para creación/eliminación de préstamos

### 4. Validación de Formularios ✅ COMPLETADO

- [x] Integrar Zod + React Hook Form
- [x] Validar schema de login (email, password)
- [x] Validar schema de registro
- [x] Validar schema de creación de préstamos (deudor, monto, interés)
- [x] Mostrar errores de validación inline en los campos

### 5. Manejo de Errores Consistente ✅ COMPLETADO

- [x] Crear ErrorBoundary global
- [x] Reemplazar `Alert.alert()` por Toast notifications
- [x] Manejo de errores de red (offline detection)
- [x] Mensajes de error amigables en español
- [x] Logging centralizado de errores

---

## Prioridad: Media

### 6. UX/UI ✅ COMPLETADO

- [x] Agregar skeleton loaders en lugar de ActivityIndicator
- [x] Pull-to-refresh en loans-historyScreen
- [x] Bottom Sheet para confirmaciones (eliminar, cancelar)
- [x] Haptic feedback en interacciones clave
- [x] Transiciones animadas entre pantallas
- [x] Keyboard avoidance mejorado en iOS

### 7. Tipado y TypeScript ✅ COMPLETADO

- [x] Habilitar `"strict": true` en tsconfig.json
- [x] Definir tipos globales (Loan, Profile, PaymentMethod)
- [x] Tipar todas las respuestas de Supabase
- [x] Eliminar usos de `as any`

### 8. Seguridad ✅ COMPLETADO

- [x] Rate limiting en login (prevenir brute force)
- [x] Sanitización de inputs antes de enviar a Supabase
- [x] Deep linking seguro para recovery de contraseña

### 9. Testing ✅ COMPLETADO

- [x] Configurar Jest + React Native Testing Library
- [x] Tests unitarios para validación de formularios (Zod schemas)
- [x] Tests unitarios para rate limiter
- [x] Tests unitarios para sanitización de inputs
- [x] Tests unitarios para deep link validation
- [x] Tests de componentes UI (SkeletonLoader)

---

## Prioridad: Baja

### 10. Performance

- [ ] Virtualizar listas con FlashList (si hay muchos préstamos)
- [ ] React.memo en componentes que no cambian frecuentemente
- [ ] Lazy loading de tabs con React.lazy
- [ ] Optimizar imágenes con expo-image (caching, lazy)

### 11. Features Nuevas

- [ ] Exportar préstamos a PDF (ya tienes expo-print)
- [ ] Notificaciones push para recordatorios de pago
- [ ] Modo offline con WatermelonDB o cache local
- [ ] Multi-idioma (español/inglés) con i18next
- [ ] Dashboard con estadísticas (total prestado, intereses, cobrado)

### 12. Developer Experience ✅ COMPLETADO

- [x] Configurar ESLint + Prettier
- [x] Husky + lint-staged para pre-commit hooks
- [x] Scripts de automatización (test, lint, format)

### 13. Código Muerto / Deuda Técnica ✅ COMPLETADO

- [x] Eliminar componentes sin uso (hello-wave, parallax-scroll-view, themed-text, themed-view, external-link, collapsible, modal)
- [x] Limpiar imports no utilizados

---

## Progreso General

| Área         | Estado        |
| ------------ | ------------- |
| Estilos      | ✅ Completado |
| Custom Hooks | ✅ Completado |
| React Query  | ✅ Completado |
| Validación   | ✅ Completado |
| Errores      | ✅ Completado |
| UX/UI        | ✅ Completado |
| TypeScript   | ✅ Completado |
| Seguridad    | ✅ Completado |
| Testing      | ✅ Completado |
| Performance  | Pendiente     |
| Features     | Pendiente     |
| DX           | ✅ Completado |
| Limpieza     | ✅ Completado |
