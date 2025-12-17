# RadioPad

Un sistema integral de gestión de efectos de sonido para emisoras de radio, diseñado para operadores técnicos, productores y jefes de operaciones.

## Descripción General

RadioPad es una solución de software especializada que permite a los operadores técnicos de emisoras de radio gestionar y personalizar efectos de sonido (FX) para diversos programas radiales a través de una interfaz intuitiva. El sistema proporciona control de acceso basado en roles, permitiendo diferentes niveles de interacción según las responsabilidades del usuario dentro de la emisora.

## Características Principales

- **Control de Acceso Basado en Roles**: Diferentes permisos para Jefes de Operadores, Operadores y Productores
- **Efectos de Sonido Específicos por Programa**: Cada programa de radio tiene su propio perfil con efectos de sonido dedicados
- **Biblioteca de Sonidos Institucional**: Efectos de sonido de toda la emisora accesibles para todos los usuarios
- **Colecciones de Sonido Personales**: Los operadores pueden mantener sus propias bibliotecas de efectos de sonido
- **Interfaz de Reproducción Simple**: Sistema de activación de efectos de sonido con un solo clic
- **Gestión de Usuarios**: Sistema integral para crear y gestionar cuentas de usuario y permisos

## Roles de Usuario

### Jefe de Operadores

- Crea y gestiona cuentas de usuario
- Asigna operadores y productores a programas de radio específicos
- Crea nuevos perfiles de programas de radio
- Gestiona la biblioteca de efectos de sonido institucional
- Tiene acceso completo a todas las funciones del sistema
- Puede operar programas directamente cuando sea necesario

### Operador

- Gestiona y personaliza efectos de sonido para los programas de radio asignados
- Puede crear y usar colecciones de efectos de sonido personales
- Tiene acceso a la biblioteca de efectos de sonido institucional (solo lectura)
- Solo puede acceder a los programas que se le han asignado

### Productor

- Puede ver los efectos de sonido de sus programas de radio asignados
- No puede modificar efectos de sonido (acceso de solo visualización)
- Tiene acceso a la biblioteca de efectos de sonido institucional (solo lectura)
- Solo puede acceder a los programas que se le han asignado

## Especificaciones Técnicas

El sistema se centra en la gestión y reproducción de efectos de sonido en lugar de la producción de audio completa:

- Asignación de botones individuales para cada efecto de sonido
- Controles de reproducción simples
- Autenticación y autorización de usuarios
- Sistema de permisos seguro basado en roles

## Primeros Pasos (Dev)

1) Instalar dependencias

```bash
npm install
```

2) Levantar JSON Server (mock backend)

```bash
npm run server
```

3) Levantar Vite

```bash
npm run dev
```

El frontend usa por defecto `http://localhost:3001` como API base.

## Usuarios Demo

- **admin / admin** (Jefe de Operadores)
- **operador / 1234** (Operador)
- **productor / 1234** (Productor)

## Secciones implementadas (estructura)

- **Login**
- **Dashboard**
- **Efectos (Pad)**
- **Programas**
- **Biblioteca** (institucional / por programa / personal)
- **Usuarios** (solo Jefe)

---

© 2025 RadioPad - Sistema Profesional de Gestión para Emisoras de Radio
