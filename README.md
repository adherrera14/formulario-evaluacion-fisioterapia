# Formulario de Valoración Funcional (Fisioterapia)

Aplicación web en React + TypeScript para registrar una evaluación funcional de fisioterapia y generar un informe PDF en español.

## Funcionalidades

- Formulario clínico estructurado (paciente, antecedentes, cribado, plan).
- Logo fijo del fisioterapeuta en encabezado del formulario y del informe PDF.
- Datos profesionales fijos de Irene Duarte incluidos automáticamente en el PDF.
- Botón de guardado y generación de PDF para compartir/imprimir.

## Datos profesionales fijos (PDF)

El formulario web no solicita datos del fisioterapeuta. El PDF siempre mostrará:

- Irene Duarte Guzmán
- Teléfono: 8699-3166
- Email: irene.duarte@hotmail.com
- Código profesional: CTCR TF-2417

## Logo fijo del centro

- El formulario y el PDF usan siempre el archivo `public/logo.png`.
- No es necesario subir el logo cada vez que se completa un formulario.
- Si deseas cambiarlo, reemplaza `public/logo.png` por la versión nueva.

## Requisitos

- Node.js 20+ (recomendado).

## Ejecución local

```bash
npm install
npm run dev:full
```

La app se abrirá en la URL local que indique Vite (normalmente `http://localhost:5173`).

## Persistencia en servidor (JSON)

- Los formularios se guardan en el servidor en el archivo `data/forms.json`.
- ID de formulario: `nombre del paciente + teléfono`.
- Al abrir la vista del formulario, el dropdown carga formularios existentes desde `/api/forms`.
- El backend actual usa archivo JSON y está preparado para reemplazarse por base de datos más adelante.

## Build de producción

```bash
npm run build
npm run preview
```

## Publicar en GitHub

Si tienes `gh` autenticado:

```bash
git init
git add .
git commit -m "Initial commit: formulario valoración funcional con PDF"
gh repo create <tu-repo> --private --source=. --remote=origin --push
```

Si prefieres crear el repositorio manualmente en GitHub, crea el repo vacío y luego:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

## Personalización pendiente

- Sustituir el logo de ejemplo por el logo final del centro.
- Ajustar/expandir preguntas según tu protocolo clínico final.
