import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { jsPDF } from 'jspdf'
import './App.css'

type FormState = {
  nombrePaciente: string
  fechaNacimiento: string
  edad: string
  sexo: string
  dniHistoria: string
  telefonoPaciente: string
  direccion: string
  fechaEvaluacion: string
  evaluador: string
  fisioterapeuta: string
  numeroColegiado: string
  contactoCentro: string
  correoCentro: string
  direccionCentro: string
  caidas12Meses: string
  lesionesRelacionadas: string
  enfermedadesCronicas: string
  medicacionRelevante: string
  ayudaMarcha: string
  limitacionesCognitivas: string
  fc: string
  ta: string
  satO2: string
  fr: string
  dolor: string
  tugTiempo: string
  tugObservaciones: string
  marchaTiempo: string
  marchaVelocidad: string
  marchaObservaciones: string
  chairStandTipo: string
  chairStandResultado: string
  chairStandObservaciones: string
  tuvoCaidas: string
  caidasDetalle: string
  miedoCaer: string
  functionalReach: string
  functionalReachObs: string
  fesPuntaje: string
  movilidadGlobal: string
  riesgoCaidas: string
  comentariosClave: string
  objetivo1: string
  objetivo2: string
  objetivo3: string
  sesionesSemana: string
  duracionSesion: string
  intervenciones: string[]
  ejerciciosHoy: string
  impresionFuncional: string
  notasAdicionales: string
}

const initialForm: FormState = {
  nombrePaciente: '',
  fechaNacimiento: '',
  edad: '',
  sexo: '',
  dniHistoria: '',
  telefonoPaciente: '',
  direccion: '',
  fechaEvaluacion: '',
  evaluador: '',
  fisioterapeuta: '',
  numeroColegiado: '',
  contactoCentro: '',
  correoCentro: '',
  direccionCentro: '',
  caidas12Meses: '',
  lesionesRelacionadas: '',
  enfermedadesCronicas: '',
  medicacionRelevante: '',
  ayudaMarcha: '',
  limitacionesCognitivas: '',
  fc: '',
  ta: '',
  satO2: '',
  fr: '',
  dolor: '',
  tugTiempo: '',
  tugObservaciones: '',
  marchaTiempo: '',
  marchaVelocidad: '',
  marchaObservaciones: '',
  chairStandTipo: '',
  chairStandResultado: '',
  chairStandObservaciones: '',
  tuvoCaidas: '',
  caidasDetalle: '',
  miedoCaer: '',
  functionalReach: '',
  functionalReachObs: '',
  fesPuntaje: '',
  movilidadGlobal: '',
  riesgoCaidas: '',
  comentariosClave: '',
  objetivo1: '',
  objetivo2: '',
  objetivo3: '',
  sesionesSemana: '',
  duracionSesion: '',
  intervenciones: [],
  ejerciciosHoy: '',
  impresionFuncional: '',
  notasAdicionales: '',
}

const interventionOptions = [
  'Reentrenamiento de marcha',
  'Equilibrio',
  'Fuerza MMII',
  'Transferencias',
  'Educación sobre caídas',
  'Adaptación del hogar',
]

function App() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitted, setSubmitted] = useState(false)

  const today = useMemo(() => new Date().toLocaleDateString('es-ES'), [])

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleInterventionToggle = (value: string) => {
    setForm((prev) => {
      const exists = prev.intervenciones.includes(value)
      return {
        ...prev,
        intervenciones: exists
          ? prev.intervenciones.filter((item) => item !== value)
          : [...prev.intervenciones, value],
      }
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
  }

  const getLogoDataUrl = async () => {
    const response = await fetch('/logo.png')
    if (!response.ok) {
      return null
    }
    const logoBlob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
          return
        }
        reject(new Error('No se pudo leer logo.png'))
      }
      reader.onerror = () => reject(new Error('No se pudo convertir logo.png'))
      reader.readAsDataURL(logoBlob)
    })
  }

  const addLabeledLine = (
    doc: jsPDF,
    label: string,
    value: string,
    cursorY: number,
    pageWidth: number,
  ) => {
    const safeValue = value?.trim() ? value : 'No especificado'
    const content = `${label}: ${safeValue}`
    const lines = doc.splitTextToSize(content, pageWidth - 20)
    doc.text(lines, 10, cursorY)
    return cursorY + lines.length * 6
  }

  const ensurePage = (doc: jsPDF, cursorY: number) => {
    if (cursorY > 275) {
      doc.addPage()
      return 15
    }
    return cursorY
  }

  const generatePdf = async () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    let cursorY = 12
    const logoDataUrl = await getLogoDataUrl()
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 10, cursorY, 28, 28)
    }

    doc.setFontSize(16)
    doc.text('Informe de Valoración Funcional', 45, 18)
    doc.setFontSize(10)
    doc.text(`Fecha de emisión: ${today}`, 45, 25)
    doc.text(`Fisioterapeuta: ${form.fisioterapeuta || 'No especificado'}`, 45, 31)
    doc.text(`Nº colegiado: ${form.numeroColegiado || 'No especificado'}`, 45, 37)
    doc.text(`Contacto: ${form.contactoCentro || 'No especificado'}`, 45, 43)
    doc.text(`Correo: ${form.correoCentro || 'No especificado'}`, 45, 49)
    doc.text(`Dirección: ${form.direccionCentro || 'No especificado'}`, 45, 55)

    cursorY = 65

    const writeSection = (title: string, rows: Array<{ label: string; value: string }>) => {
      cursorY = ensurePage(doc, cursorY)
      doc.setFontSize(12)
      doc.text(title, 10, cursorY)
      cursorY += 7
      doc.setFontSize(10)
      rows.forEach((row) => {
        cursorY = ensurePage(doc, cursorY)
        cursorY = addLabeledLine(doc, row.label, row.value, cursorY, pageWidth)
      })
      cursorY += 4
    }

    writeSection('1. Datos del paciente', [
      { label: 'Nombre', value: form.nombrePaciente },
      { label: 'Fecha de nacimiento', value: form.fechaNacimiento },
      { label: 'Edad', value: form.edad },
      { label: 'Sexo', value: form.sexo },
      { label: 'DNI / Historia clínica', value: form.dniHistoria },
      { label: 'Teléfono', value: form.telefonoPaciente },
      { label: 'Dirección', value: form.direccion },
      { label: 'Fecha de evaluación', value: form.fechaEvaluacion },
      { label: 'Evaluador', value: form.evaluador },
    ])

    writeSection('2. Antecedentes relevantes', [
      { label: 'Caídas últimos 12 meses', value: form.caidas12Meses },
      { label: 'Lesiones relacionadas', value: form.lesionesRelacionadas },
      { label: 'Enfermedades crónicas', value: form.enfermedadesCronicas },
      { label: 'Medicación relevante', value: form.medicacionRelevante },
      { label: 'Ayudas para la marcha', value: form.ayudaMarcha },
      { label: 'Limitaciones cognitivas/sensoriales', value: form.limitacionesCognitivas },
    ])

    writeSection('3. Signos vitales y cribado', [
      { label: 'FC (lpm)', value: form.fc },
      { label: 'TA (mmHg)', value: form.ta },
      { label: 'SatO2 (%)', value: form.satO2 },
      { label: 'FR (rpm)', value: form.fr },
      { label: 'Dolor (0-10)', value: form.dolor },
      { label: 'TUG tiempo (s)', value: form.tugTiempo },
      { label: 'TUG observaciones', value: form.tugObservaciones },
      { label: 'Marcha 4m tiempo (s)', value: form.marchaTiempo },
      { label: 'Marcha velocidad (m/s)', value: form.marchaVelocidad },
      { label: 'Marcha observaciones', value: form.marchaObservaciones },
      { label: 'Chair Stand tipo', value: form.chairStandTipo },
      { label: 'Chair Stand resultado', value: form.chairStandResultado },
      { label: 'Chair Stand observaciones', value: form.chairStandObservaciones },
      { label: '¿Tuvo caídas?', value: form.tuvoCaidas },
      { label: 'Detalle de caídas', value: form.caidasDetalle },
      { label: 'Miedo a caer', value: form.miedoCaer },
      { label: 'Functional Reach (cm)', value: form.functionalReach },
      { label: 'Functional Reach observaciones', value: form.functionalReachObs },
      { label: 'FES-I breve puntaje', value: form.fesPuntaje },
    ])

    writeSection('4. Resumen y plan', [
      { label: 'Movilidad global', value: form.movilidadGlobal },
      { label: 'Riesgo de caídas', value: form.riesgoCaidas },
      { label: 'Comentarios clave', value: form.comentariosClave },
      { label: 'Objetivo 1', value: form.objetivo1 },
      { label: 'Objetivo 2', value: form.objetivo2 },
      { label: 'Objetivo 3', value: form.objetivo3 },
      { label: 'Sesiones por semana', value: form.sesionesSemana },
      { label: 'Duración por sesión (min)', value: form.duracionSesion },
      {
        label: 'Intervenciones propuestas',
        value: form.intervenciones.length ? form.intervenciones.join(', ') : 'No especificado',
      },
      { label: 'Ejercicios indicados hoy', value: form.ejerciciosHoy },
      { label: 'Impresión funcional / plan 3 meses', value: form.impresionFuncional },
      { label: 'Notas adicionales', value: form.notasAdicionales },
    ])

    doc.save(
      `informe-valoracion-${form.nombrePaciente
        .toLowerCase()
        .replaceAll(' ', '-') || 'paciente'}.pdf`,
    )
  }

  return (
    <main className="app-shell">
      <h1>Formulario de Valoración Funcional</h1>
      <p className="app-subtitle">Uso clínico para fisioterapia con exportación a PDF en español.</p>

      <form onSubmit={handleSubmit} className="form-layout">
        <section className="panel">
          <h2>Datos del fisioterapeuta (encabezado del PDF)</h2>
          <div className="grid two-cols">
            <label>
              Nombre del fisioterapeuta
              <input name="fisioterapeuta" value={form.fisioterapeuta} onChange={handleChange} />
            </label>
            <label>
              Nº de colegiado
              <input name="numeroColegiado" value={form.numeroColegiado} onChange={handleChange} />
            </label>
            <label>
              Teléfono / contacto
              <input name="contactoCentro" value={form.contactoCentro} onChange={handleChange} />
            </label>
            <label>
              Correo electrónico
              <input name="correoCentro" value={form.correoCentro} onChange={handleChange} />
            </label>
          </div>
          <label>
            Dirección profesional
            <input name="direccionCentro" value={form.direccionCentro} onChange={handleChange} />
          </label>
          <label>
            Logo del informe (fijo)
            <input value="public/logo.png" readOnly />
          </label>
          <img className="logo-preview" src="/logo.png" alt="Logo del centro" />
        </section>

        <section className="panel">
          <h2>Datos del paciente</h2>
          <div className="grid two-cols">
            <label>
              Nombre
              <input name="nombrePaciente" value={form.nombrePaciente} onChange={handleChange} required />
            </label>
            <label>
              Fecha de nacimiento
              <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} />
            </label>
            <label>
              Edad
              <input name="edad" value={form.edad} onChange={handleChange} />
            </label>
            <label>
              Sexo
              <input name="sexo" value={form.sexo} onChange={handleChange} />
            </label>
            <label>
              DNI / Historia clínica
              <input name="dniHistoria" value={form.dniHistoria} onChange={handleChange} />
            </label>
            <label>
              Teléfono
              <input name="telefonoPaciente" value={form.telefonoPaciente} onChange={handleChange} />
            </label>
            <label>
              Fecha evaluación
              <input type="date" name="fechaEvaluacion" value={form.fechaEvaluacion} onChange={handleChange} />
            </label>
            <label>
              Evaluador
              <input name="evaluador" value={form.evaluador} onChange={handleChange} />
            </label>
          </div>
          <label>
            Dirección
            <input name="direccion" value={form.direccion} onChange={handleChange} />
          </label>
        </section>

        <section className="panel">
          <h2>Antecedentes y cribado</h2>
          <div className="grid two-cols">
            <label>
              Caídas en 12 meses (nº)
              <input name="caidas12Meses" value={form.caidas12Meses} onChange={handleChange} />
            </label>
            <label>
              Lesiones relacionadas
              <input name="lesionesRelacionadas" value={form.lesionesRelacionadas} onChange={handleChange} />
            </label>
            <label>
              Enfermedades crónicas
              <input name="enfermedadesCronicas" value={form.enfermedadesCronicas} onChange={handleChange} />
            </label>
            <label>
              Medicación relevante
              <input name="medicacionRelevante" value={form.medicacionRelevante} onChange={handleChange} />
            </label>
            <label>
              Ayuda para la marcha
              <select name="ayudaMarcha" value={form.ayudaMarcha} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Ninguna</option>
                <option>Bastón</option>
                <option>Andador</option>
                <option>Otra</option>
              </select>
            </label>
            <label>
              Limitaciones cognitivas/sensoriales
              <input name="limitacionesCognitivas" value={form.limitacionesCognitivas} onChange={handleChange} />
            </label>
          </div>
          <div className="grid five-cols">
            <label>
              FC
              <input name="fc" value={form.fc} onChange={handleChange} />
            </label>
            <label>
              TA
              <input name="ta" value={form.ta} onChange={handleChange} />
            </label>
            <label>
              SatO2
              <input name="satO2" value={form.satO2} onChange={handleChange} />
            </label>
            <label>
              FR
              <input name="fr" value={form.fr} onChange={handleChange} />
            </label>
            <label>
              Dolor (0-10)
              <input name="dolor" value={form.dolor} onChange={handleChange} />
            </label>
          </div>

          <div className="grid two-cols">
            <label>
              TUG tiempo (s)
              <input name="tugTiempo" value={form.tugTiempo} onChange={handleChange} />
            </label>
            <label>
              TUG observaciones
              <input name="tugObservaciones" value={form.tugObservaciones} onChange={handleChange} />
            </label>
            <label>
              Marcha 4m tiempo (s)
              <input name="marchaTiempo" value={form.marchaTiempo} onChange={handleChange} />
            </label>
            <label>
              Marcha velocidad (m/s)
              <input name="marchaVelocidad" value={form.marchaVelocidad} onChange={handleChange} />
            </label>
            <label>
              Marcha observaciones
              <input name="marchaObservaciones" value={form.marchaObservaciones} onChange={handleChange} />
            </label>
            <label>
              Chair Stand (30s o 5-STS)
              <input name="chairStandTipo" value={form.chairStandTipo} onChange={handleChange} />
            </label>
            <label>
              Chair Stand resultado
              <input name="chairStandResultado" value={form.chairStandResultado} onChange={handleChange} />
            </label>
            <label>
              Chair Stand observaciones
              <input name="chairStandObservaciones" value={form.chairStandObservaciones} onChange={handleChange} />
            </label>
            <label>
              ¿Tuvo caídas?
              <select name="tuvoCaidas" value={form.tuvoCaidas} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Sí</option>
                <option>No</option>
              </select>
            </label>
            <label>
              Miedo a caer
              <select name="miedoCaer" value={form.miedoCaer} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Bajo</option>
                <option>Moderado</option>
                <option>Alto</option>
              </select>
            </label>
          </div>

          <label>
            Detalle de caídas / causa / lesiones
            <textarea name="caidasDetalle" value={form.caidasDetalle} onChange={handleChange} rows={3} />
          </label>
          <div className="grid two-cols">
            <label>
              Functional Reach (cm)
              <input name="functionalReach" value={form.functionalReach} onChange={handleChange} />
            </label>
            <label>
              FES-I breve puntuación total
              <input name="fesPuntaje" value={form.fesPuntaje} onChange={handleChange} />
            </label>
          </div>
          <label>
            Observaciones de equilibrio
            <textarea name="functionalReachObs" value={form.functionalReachObs} onChange={handleChange} rows={3} />
          </label>
        </section>

        <section className="panel">
          <h2>Evaluación global y plan</h2>
          <div className="grid two-cols">
            <label>
              Movilidad global
              <select name="movilidadGlobal" value={form.movilidadGlobal} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Buena</option>
                <option>Moderada</option>
                <option>Limitada</option>
                <option>Dependiente</option>
              </select>
            </label>
            <label>
              Riesgo de caídas
              <select name="riesgoCaidas" value={form.riesgoCaidas} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option>Bajo</option>
                <option>Moderado</option>
                <option>Alto</option>
              </select>
            </label>
          </div>
          <label>
            Comentarios clave
            <textarea name="comentariosClave" value={form.comentariosClave} onChange={handleChange} rows={3} />
          </label>

          <div className="grid three-cols">
            <label>
              Objetivo 1 (4-6 semanas)
              <input name="objetivo1" value={form.objetivo1} onChange={handleChange} />
            </label>
            <label>
              Objetivo 2
              <input name="objetivo2" value={form.objetivo2} onChange={handleChange} />
            </label>
            <label>
              Objetivo 3
              <input name="objetivo3" value={form.objetivo3} onChange={handleChange} />
            </label>
          </div>

          <div className="grid two-cols">
            <label>
              Sesiones por semana
              <input name="sesionesSemana" value={form.sesionesSemana} onChange={handleChange} />
            </label>
            <label>
              Duración de sesión (min)
              <input name="duracionSesion" value={form.duracionSesion} onChange={handleChange} />
            </label>
          </div>

          <fieldset className="checkboxes">
            <legend>Intervenciones propuestas</legend>
            {interventionOptions.map((option) => (
              <label key={option} className="inline">
                <input
                  type="checkbox"
                  checked={form.intervenciones.includes(option)}
                  onChange={() => handleInterventionToggle(option)}
                />
                {option}
              </label>
            ))}
          </fieldset>

          <label>
            Ejercicios indicados hoy
            <textarea name="ejerciciosHoy" value={form.ejerciciosHoy} onChange={handleChange} rows={3} />
          </label>
          <label>
            Impresión funcional / plan a 3 meses
            <textarea name="impresionFuncional" value={form.impresionFuncional} onChange={handleChange} rows={3} />
          </label>
          <label>
            Notas adicionales
            <textarea name="notasAdicionales" value={form.notasAdicionales} onChange={handleChange} rows={3} />
          </label>
        </section>

        <div className="actions">
          <button type="submit">Guardar formulario</button>
          <button type="button" onClick={generatePdf} disabled={!submitted}>
            Generar PDF
          </button>
        </div>

        {!submitted && <p className="hint">Primero guarda el formulario para habilitar la exportación.</p>}
        {submitted && <p className="hint success">Formulario guardado. Ya puedes generar el PDF.</p>}
      </form>
    </main>
  )
}

export default App
