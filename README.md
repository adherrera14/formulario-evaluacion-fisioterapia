# Formulario de Valoración Funcional (Fisioterapia)

Aplicación web en React + TypeScript para registrar una evaluación funcional de fisioterapia y generar un informe PDF en español.

## Funcionalidades

- Formulario clínico estructurado (paciente, antecedentes, cribado, plan).
- Carga de logo del fisioterapeuta para encabezado del informe.
- Datos de contacto del profesional incluidos en el PDF.
- Botón de guardado y generación de PDF para compartir/imprimir.

## Requisitos

- Node.js 20+ (recomendado).

## Ejecución local

```bash
npm install
npm run dev
```

La app se abrirá en la URL local que indique Vite (normalmente `http://localhost:5173`).

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
- Confirmar datos finales de contacto para encabezado del informe.
- Ajustar/expandir preguntas según tu protocolo clínico final.
