# Cómo Agregar Nuevos Personajes VeeFriends

## Estructura de Datos

Cada personaje necesita la siguiente información:

### 1. **ID** (string)

- Identificador único en minúsculas y con guiones
- Ejemplo: `"graceful-goldfish"`, `"patient-panda"`

### 2. **Nombre** (string)

- Nombre completo del personaje para mostrar
- Ejemplo: `"Graceful Goldfish"`, `"Patient Panda"`

### 3. **Descripción** (string)

- Breve descripción del personaje
- Ejemplo: `"A beautiful and elegant goldfish that moves with grace and poise."`

### 4. **Nivel** (number)

- Nivel en el que aparece el personaje
- Ejemplo: `1`, `2`, `3`

### 5. **Imagen de Mapa** (URL)

- URL de la imagen que se usa para colocar el personaje en el mapa
- Tamaño recomendado: Optimizado para mostrarse a 80px
- Formato: PNG con fondo transparente

### 6. **Imagen de Card** (URL)

- URL de la imagen que se muestra en los modales y el álbum
- Tamaño recomendado: Alta calidad, mínimo 350x350px
- Formato: PNG con fondo transparente

---

## Pasos para Agregar un Personaje

### 1. Sube las imágenes a un servidor

Necesitas 2 URLs:

- URL de la imagen para el mapa (`mapImageUrl`)
- URL de la imagen para la card (`cardImageUrl`)

### 2. Edita el archivo `src/config/CharactersData.ts`

Agrega un nuevo objeto al array `CHARACTERS_DATA`:

\`\`\`typescript
{
id: "patient-panda",
name: "Patient Panda",
description: "A calm and patient panda that teaches the value of waiting.",
level: 2,
mapImageUrl: "https://ejemplo.com/patient-panda-map.png",
cardImageUrl: "https://ejemplo.com/patient-panda-card.png",
},
\`\`\`

### 3. Ejemplo Completo

\`\`\`typescript
export const CHARACTERS_DATA: CharacterData[] = [
{
id: "graceful-goldfish",
name: "Graceful Goldfish",
description: "A beautiful and elegant goldfish that moves with grace and poise.",
level: 1,
mapImageUrl: "https://i.postimg.cc/sfVWkF4c/graceful-goldfish.png",
cardImageUrl: "https://i.postimg.cc/sfVWkF4c/graceful-goldfish.png",
},
{
id: "patient-panda",
name: "Patient Panda",
description: "A calm and patient panda that teaches the value of waiting.",
level: 2,
mapImageUrl: "https://ejemplo.com/patient-panda-map.png",
cardImageUrl: "https://ejemplo.com/patient-panda-card.png",
},
{
id: "compassionate-cobra",
name: "Compassionate Cobra",
description: "A kind cobra that shows empathy to all creatures.",
level: 3,
mapImageUrl: "https://ejemplo.com/compassionate-cobra-map.png",
cardImageUrl: "https://ejemplo.com/compassionate-cobra-card.png",
},
];
\`\`\`

---

## Notas Importantes

- **Las imágenes se cargan automáticamente**: El juego cargará todas las imágenes al iniciar
- **Múltiples personajes por nivel**: Puedes tener varios personajes con el mismo nivel
- **Orden de niveles**: El juego cargará los personajes según el nivel actual
- **IDs únicos**: Asegúrate de que cada ID sea único en todo el array

---

## Plantilla para Copiar y Pegar

\`\`\`typescript
{
id: "NOMBRE-EN-MINUSCULAS",
name: "Nombre del Personaje",
description: "Descripción del personaje aquí.",
level: NUMERO_DEL_NIVEL,
mapImageUrl: "URL_IMAGEN_MAPA",
cardImageUrl: "URL_IMAGEN_CARD",
},
\`\`\`

---

## Sistema Actual

El juego está configurado para:

- Mostrar un personaje diferente por nivel
- Guardar los personajes encontrados en una colección
- Mostrar el nombre y descripción en los modales
- Cargar automáticamente las imágenes correctas

¡Listo para agregar nuevos personajes VeeFriends! 🎮✨
